import { libxmljs } from "libxslt";
import { NAMESPACES } from "../../shared.js";
import { NodeTypes } from "../shared.js";
import { XPathResult } from "./XPathResult.js";
const { Document, Element } = libxmljs;
class DOMExtendedDocument {
  constructor() {
    this.nodeName = "#document";
    this.nodeType = NodeTypes.DOCUMENT_NODE;
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
      Object.entries(NAMESPACES).filter(
        ([prefix, value]) => namespaceResolver.lookupNamespaceURI(prefix) === value
      )
    );
    if (resultType === XPathResult.FIRST_ORDERED_NODE_TYPE) {
      const result = (contextNode ?? this).get(
        xpathExpression,
        namespaces
      );
      const results2 = result == null ? [] : [result];
      return new XPathResult(results2);
    }
    const results = (contextNode ?? this).find(
      xpathExpression,
      namespaces
    );
    return new XPathResult(results);
  }
}
const { constructor: _, ...descriptors } = Object.getOwnPropertyDescriptors(
  DOMExtendedDocument.prototype
);
Object.defineProperties(Document.prototype, descriptors);
export {
  DOMExtendedDocument
};
//# sourceMappingURL=Document.js.map
