/// <reference types="typings/libxmljs" />
/// <reference types="src/dom/node/extensions" />
import type { Node } from 'libxmljs';
import type { DOM } from '../abstract';
/** @package */
export declare class DOMExtendedNode implements DOM.Node {
    get nodeName(): string;
    get nodeType(): number;
    get ownerDocument(): import("libxmljs").Document;
    get parentElement(): import("libxmljs").Element | null;
    get textContent(): string | null;
    set textContent(value: string);
    cloneNode<T extends Node>(this: DOMExtendedNode & T, deep?: boolean): DOMExtendedNode & T;
}
