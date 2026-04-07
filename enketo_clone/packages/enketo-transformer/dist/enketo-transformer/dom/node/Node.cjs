"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const libxslt = require("libxslt");
const shared = require("../shared.cjs");
const { Element, Document } = libxslt.libxmljs;
Object.assign(libxslt.libxmljs, {
  Node: shared.NodeTypes
});
class DOMExtendedNode {
  get nodeName() {
    return this.name();
  }
  get nodeType() {
    const type = this.type();
    switch (type) {
      case "attribute": {
        return shared.NodeTypes.ATTRIBUTE_NODE;
      }
      case "comment": {
        return shared.NodeTypes.COMMENT_NODE;
      }
      case "document": {
        return shared.NodeTypes.DOCUMENT_NODE;
      }
      case "element": {
        return shared.NodeTypes.ELEMENT_NODE;
      }
      case "text": {
        return shared.NodeTypes.TEXT_NODE;
      }
      default: {
        throw new Error(`Unknown node type: `);
      }
    }
  }
  get ownerDocument() {
    if (this.nodeType === shared.NodeTypes.DOCUMENT_NODE) {
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
  Object.assign(Constructor, shared.NodeTypes);
  Object.defineProperties(Constructor.prototype, descriptors);
});
exports.DOMExtendedNode = DOMExtendedNode;
//# sourceMappingURL=Node.cjs.map
