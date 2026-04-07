import type { DOM } from '../abstract';
import type { DOMMimeType } from '../abstract/DOMParser';
/** @package */
export declare class DOMParser implements DOM.DOMParser {
    parseFromString: (docStr: string, mimeType: DOMMimeType) => DOM.Document;
}
