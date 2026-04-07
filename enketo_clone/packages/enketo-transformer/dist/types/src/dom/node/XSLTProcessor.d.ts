import type { Document } from 'libxmljs';
import type { DOM } from '../abstract';
/** @package */
export declare class XSLTProcessor {
    private parameters;
    private stylesheet;
    importStylesheet(xsltDoc: DOM.Document): void;
    reset(): void;
    setParameter(_namespaceURI: string | null, name: string, value: unknown): void;
    transformToDocument(xmlDoc: DOM.Document): Document;
}
