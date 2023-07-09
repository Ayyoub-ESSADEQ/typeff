const height = 669;
const width = 292;

figma.showUI(__html__,{themeColors : true});
figma.ui.resize(width, height);

function generateSubstrings(input: string, type : string): string[] {
  let substrings: string[] = [];
  //This is used to indicate the beginning of writing
  substrings.push('');
  substrings.push('|');

  for (let i = 1; i <= input.length; i++) {
    substrings.push(input.slice(0, i) + '|');
  }
  substrings.push(input);

  if (type === 'typing') substrings.reverse();
  else if (type === 'looping'){
    const reversed = [...substrings];
    reversed.reverse();
    const components = [...substrings, ...reversed];
    substrings = components;
  }
  return substrings;
}

function generateTextComponents(input: string, width : number, textStyle : TextStyle, type : string): ComponentNode[]{
  const textFragments = generateSubstrings(input, type);
  const textNodes : ComponentNode[] = [];
  
  textFragments.reverse();

  let i = 0;
  for (const Fragemnt of textFragments){
    const text = figma.createText();
    const componentNode = figma.createComponent();
    const fitContent = text.width > width 
    text.characters = Fragemnt;
    text.textStyleId = textStyle.id;
    if(!fitContent) text.resize(width, text.height);
    componentNode.y = (30 + text.height)*i;
    componentNode.appendChild(text);
    componentNode.resize(text.width, text.height);
    componentNode.name = i.toString();
    textNodes.push(componentNode);

    i++
  }
  return textNodes;
}

function applyTypingEffect(componentSetNode : ComponentNode[], delay : number) : void{
  const n = componentSetNode.length;
  for(let i = 0; i<n-1; i++){
    const fromComponent = componentSetNode[i];
    const toComponent = componentSetNode[i+1];
    transition(fromComponent, toComponent, delay);
    }
}

function transition(from : ComponentNode, to : ComponentNode, delay ?: number){
  const reaction : Reaction = {
    action: {
      type: 'NODE',
      destinationId: to.id,
      navigation: 'CHANGE_TO',
      transition: {
        type:'SMART_ANIMATE',
        easing: { type: 'EASE_OUT' },
        duration: 0
      },
      preserveScrollPosition: false
    },
    trigger: { type: 'AFTER_TIMEOUT',timeout : delay ?? 0.05}
  }

  from.reactions = [reaction];
};

figma.ui.onmessage = async msg => {
  //Load Inter font (only to avoid any problem)
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  //Message deconstrution
  const text = msg.content;
  const Width = parseFloat(msg.width);
  const type = msg.type;
  const delay = parseFloat(msg.delay)/1000;
  const variantName = msg.variantName;
  const textStyle : TextStyle = figma.createTextStyle();

  textStyle.name = variantName;
  textStyle.description = "This style is used to style the text of the typing effect";

  const textNodes = generateTextComponents(text, Width, textStyle, type);
  const ComponetNodeSet : ComponentSetNode = figma.combineAsVariants(textNodes, figma.currentPage);

  applyTypingEffect(textNodes, delay);

  if(type === 'looping'){
    const n = textNodes.length;
    const start = textNodes[0];
    const end = textNodes[n-1];
    textNodes[Math.round(n/2)].x = 0;
    textNodes[Math.round(n/2)].y = 0;
    transition(end, start);
  }

  else if(type === 'typing'){
    const n = textNodes.length;
    textNodes[n-1].x = 0;
    textNodes[n-1].y = 0;
  }

  const {height, width} = textNodes[0];

  //Setting the ComponentSet properties
  ComponetNodeSet.clipsContent = true;
  ComponetNodeSet.resize(width, height);
  ComponetNodeSet.name = variantName;

  //ask 


  // Zoom in to fit the selection on the viewport
  ComponetNodeSet.x = figma.viewport.center.x
  ComponetNodeSet.y = figma.viewport.center.y
  figma.currentPage.appendChild(ComponetNodeSet);
  figma.viewport.scrollAndZoomIntoView([textNodes[0]]);
  figma.closePlugin();
};