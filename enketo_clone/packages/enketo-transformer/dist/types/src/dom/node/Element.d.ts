/// <reference types="typings/libxmljs" />
/// <reference types="src/dom/node/extensions" />
import type { Node } from 'libxmljs';
import type { DOM } from '../abstract';
declare const Element: typeof import("libxmljs").Element;
/** @package */
export interface DOMExtendedElement extends DOM.Node {
    remove(): void;
}
export declare class DOMExtendedElement implements DOM.Element {
    readonly nodeType: number;
    get attributes(): {
        name: string;
        namespaceURI: null;
        value: string;
    }[];
    get firstChild(): Node;
    get firstElementChild(): Element | null;
    get localName(): string;
    get nodeName(): string;
    get outerHTML(): string;
    append(this: DOMExtendedElement & Element, ...nodes: Node[]): void;
    getAttribute(this: DOMExtendedElement & Element, name: string): string | null;
    hasAttribute(this: Element & DOMExtendedElement, name: string): boolean;
    insertAdjacentHTML(this: Element & DOMExtendedElement, _position: 'afterend', html: string): void;
    replaceWith(this: Element & DOMExtendedElement, ...nodes: Node[]): void;
    removeAttribute(this: DOMExtendedElement & Element, name: string): void;
    setAttribute(this: DOMExtendedElement & Element, name: string, value: string): void;
    setAttributeNS(this: DOMExtendedElement & Element, _namespaceURI: string | null, name: string, value: string): void;
}
type Element = InstanceType<typeof Element>;
export {};
