/** @package */
export declare const NodeTypes: {
    ELEMENT_NODE: number;
    ATTRIBUTE_NODE: number;
    TEXT_NODE: number;
    CDATA_SECTION_NODE: number;
    PROCESSING_INSTRUCTION_NODE: number;
    COMMENT_NODE: number;
    DOCUMENT_NODE: number;
    DOCUMENT_TYPE_NODE: number;
    DOCUMENT_FRAGMENT_NODE: number;
};
/** @package */
export type NodeType = (typeof NodeTypes)[keyof typeof NodeTypes];
