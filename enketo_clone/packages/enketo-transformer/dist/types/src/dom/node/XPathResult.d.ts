import type { DOM } from '../abstract';
/** @package */
export declare class XPathResult implements DOM.XPathResult {
    private results;
    static ORDERED_NODE_SNAPSHOT_TYPE: 6;
    static FIRST_ORDERED_NODE_TYPE: 9;
    get singleNodeValue(): import("../abstract/Node").Node;
    get snapshotLength(): number;
    constructor(results: DOM.Node[]);
    snapshotItem(index: number): import("../abstract/Node").Node;
}
type XPathResultTypeKeys = {
    [K in keyof XPathResult]: K extends `${string}_TYPE` ? K : never;
}[keyof XPathResult];
/** @package */
export type XPathResultType = XPathResult[XPathResultTypeKeys];
export {};
