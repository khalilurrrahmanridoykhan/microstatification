import { libxmljs } from "libxslt";
import { NodeTypes } from "../shared.js";
const { Element, Document } = libxmljs;
Object.assign(libxmljs, {
  Node: NodeTypes
});
class DOMExtendedNode {
  get nodeName() {
    return this.name();
  }
  get nodeType() {
    const type = this.type();
    switch (type) {
      case "attribute": {
        return NodeTypes.ATTRIBUTE_NODE;
      }
      case "comment": {
        return NodeTypes.COMMENT_NODE;
      }
      case "document": {
        return NodeTypes.DOCUMENT_NODE;
      }
      case "element": {
        return NodeTypes.ELEMENT_NODE;
      }
      case "text": {
        return NodeTypes.TEXT_NODE;
      }
      default: {
        throw new Error(`Unknown node type: `);
      }
    }
  }
  get ownerDocument() {
    if (this.nodeType === NodeTypes.DOCUMENT_NODE) {
      return this;
    }
    return this.doc();
  }
  get parentElement() {
    return this.parent();
  }
  get textContent() {
    return this.text();
  }
  set textContent(value) {
    this.text(value);
  }
  cloneNode(deep = false) {
    return this.clone(deep);
  }
}
const { constructor: _, ...descriptors } = Object.getOwnPropertyDescriptors(
  DOMExtendedNode.prototype
);
[Element, Document].forEach((Constructor) => {
  Object.assign(Constructor, NodeTypes);
  Object.defineProperties(Constructor.prototype, descriptors);
});
export {
  DOMExtendedNode
};
//# sourceMappingURL=Node.js.map
