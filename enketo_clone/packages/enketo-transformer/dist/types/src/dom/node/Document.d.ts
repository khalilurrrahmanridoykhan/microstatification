/// <reference types="typings/libxmljs" />
/// <reference types="src/dom/node/extensions" />
import type { DOM } from '../abstract';
declare const Document: typeof import("libxmljs").Document, Element: typeof import("libxmljs").Element;
/** @package */
export interface DOMExtendedDocument extends DOM.Node {
}
export declare class DOMExtendedDocument implements DOM.Document {
    get documentElement(): import("libxmljs").Element;
    readonly nodeName = "#document";
    readonly nodeType: number;
    createElement(this: DOMExtendedDocument & Document, name: string): Element;
    createElementNS(this: DOMExtendedDocument & Document, namespaceURI: string | null, name: string): Element;
    evaluate(this: Document & DOMExtendedDocument, xpathExpression: string, contextNode: Document | Element, namespaceResolver: DOM.NamespaceResolver | null, resultType: number): DOM.XPathResult;
}
type Document = InstanceType<typeof Document>;
type Element = InstanceType<typeof Element>;
export {};
