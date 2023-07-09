"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const height = 669;
const width = 292;
figma.showUI(__html__, { themeColors: true });
figma.ui.resize(width, height);
function generateSubstrings(input, type) {
    let substrings = [];
    //This is used to indicate the beginning of writing
    substrings.push('');
    substrings.push('|');
    for (let i = 1; i <= input.length; i++) {
        substrings.push(input.slice(0, i) + '|');
    }
    substrings.push(input);
    if (type === 'typing')
        substrings.reverse();
    else if (type === 'looping') {
        const reversed = [...substrings];
        reversed.reverse();
        const components = [...substrings, ...reversed];
        substrings = components;
    }
    return substrings;
}
function generateTextComponents(input, width, textStyle, type) {
    const textFragments = generateSubstrings(input, type);
    const textNodes = [];
    textFragments.reverse();
    let i = 0;
    for (const Fragemnt of textFragments) {
        const text = figma.createText();
        const componentNode = figma.createComponent();
        const fitContent = text.width > width;
        text.characters = Fragemnt;
        text.textStyleId = textStyle.id;
        if (!fitContent)
            text.resize(width, text.height);
        componentNode.y = (30 + text.height) * i;
        componentNode.appendChild(text);
        componentNode.resize(text.width, text.height);
        componentNode.name = i.toString();
        textNodes.push(componentNode);
        i++;
    }
    return textNodes;
}
function applyTypingEffect(componentSetNode, delay) {
    const n = componentSetNode.length;
    for (let i = 0; i < n - 1; i++) {
        const fromComponent = componentSetNode[i];
        const toComponent = componentSetNode[i + 1];
        transition(fromComponent, toComponent, delay);
    }
}
function transition(from, to, delay) {
    const reaction = {
        action: {
            type: 'NODE',
            destinationId: to.id,
            navigation: 'CHANGE_TO',
            transition: {
                type: 'SMART_ANIMATE',
                easing: { type: 'EASE_OUT' },
                duration: 0
            },
            preserveScrollPosition: false
        },
        trigger: { type: 'AFTER_TIMEOUT', timeout: delay !== null && delay !== void 0 ? delay : 0.05 }
    };
    from.reactions = [reaction];
}
;
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    //Load Inter font (only to avoid any problem)
    yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
    //Message deconstrution
    const text = msg.content;
    const Width = parseFloat(msg.width);
    const type = msg.type;
    const delay = parseFloat(msg.delay) / 1000;
    const variantName = msg.variantName;
    const textStyle = figma.createTextStyle();
    textStyle.name = variantName;
    textStyle.description = "This style is used to style the text of the typing effect";
    const textNodes = generateTextComponents(text, Width, textStyle, type);
    const ComponetNodeSet = figma.combineAsVariants(textNodes, figma.currentPage);
    applyTypingEffect(textNodes, delay);
    if (type === 'looping') {
        const n = textNodes.length;
        const start = textNodes[0];
        const end = textNodes[n - 1];
        textNodes[Math.round(n / 2)].x = 0;
        textNodes[Math.round(n / 2)].y = 0;
        transition(end, start);
    }
    else if (type === 'typing') {
        const n = textNodes.length;
        textNodes[n - 1].x = 0;
        textNodes[n - 1].y = 0;
    }
    const { height, width } = textNodes[0];
    //Setting the ComponentSet properties
    ComponetNodeSet.clipsContent = true;
    ComponetNodeSet.resize(width, height);
    ComponetNodeSet.name = variantName;
    //ask 
    // Zoom in to fit the selection on the viewport
    ComponetNodeSet.x = figma.viewport.center.x;
    ComponetNodeSet.y = figma.viewport.center.y;
    figma.currentPage.appendChild(ComponetNodeSet);
    figma.viewport.scrollAndZoomIntoView([textNodes[0]]);
    figma.closePlugin();
});
