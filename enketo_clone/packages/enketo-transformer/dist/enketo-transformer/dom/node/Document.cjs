"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const libxslt = require("libxslt");
const shared$1 = require("../../shared.cjs");
const shared = require("../shared.cjs");
const XPathResult = require("./XPathResult.cjs");
const { Document, Element } = libxslt.libxmljs;
class DOMExtendedDocument {
  constructor() {
    this.nodeName = "#document";
    this.nodeType = shared.NodeTypes.DOCUMENT_NODE;
  }
  get documentElement() {
    return this.root();
  }
  createElement(name) {
    return new Element(this, name);
  }
  createElementNS(namespaceURI, name) {
    const [prefix, suffix] = name.split(":");
    const element = new Element(this, suffix ?? name);
    if (suffix == null || namespaceURI == null) {
      return element;
    }
    const namespace = element.defineNamespace(prefix, namespaceURI);
    element.namespace(namespace);
    return element;
  }
  evaluate(xpathExpression, contextNode, namespaceResolver, resultType) {
    const namespaces = namespaceResolver == null ? void 0 : Object.fromEntries(
      Object.entries(shared$1.NAMESPACES).filter(
        ([prefix, value]) => namespaceResolver.lookupNamespaceURI(prefix) === value
      )
    );
    if (resultType === XPathResult.XPathResult.FIRST_ORDERED_NODE_TYPE) {
      const result = (contextNode ?? this).get(
        xpathExpression,
        namespaces
      );
      const results2 = result == null ? [] : [result];
      return new XPathResult.XPathResult(results2);
    }
    const results = (contextNode ?? this).find(
      xpathExpression,
      namespaces
    );
    return new XPathResult.XPathResult(results);
  }
}
const { constructor: _, ...descriptors } = Object.getOwnPropertyDescriptors(
  DOMExtendedDocument.prototype
);
Object.defineProperties(Document.prototype, descriptors);
exports.DOMExtendedDocument = DOMExtendedDocument;
//# sourceMappingURL=Document.cjs.map
