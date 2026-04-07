import { libxmljs } from "libxslt";
import { NodeTypes } from "../shared.js";
const { Element, parseXml } = libxmljs;
class DOMExtendedElement {
  constructor() {
    this.nodeType = NodeTypes.DOCUMENT_NODE;
  }
  get attributes() {
    return this.attrs().map((attr) => ({
      name: attr.name(),
      namespaceURI: null,
      value: attr.value() ?? ""
    }));
  }
  get firstChild() {
    return this.child(0) ?? null;
  }
  get firstElementChild() {
    return this.get("*") ?? null;
  }
  get localName() {
    var _a;
    const prefix = (_a = this.namespace()) == null ? void 0 : _a.prefix();
    if (prefix == null) {
      return this.nodeName;
    }
    return this.nodeName.replace(`${prefix}:`, "");
  }
  get nodeName() {
    return this.name();
  }
  get outerHTML() {
    return this.toString(false);
  }
  append(...nodes) {
    nodes.forEach((node) => {
      this.addChild(node);
    });
  }
  getAttribute(name) {
    var _a;
    return ((_a = this.attr(name)) == null ? void 0 : _a.value()) ?? null;
  }
  hasAttribute(name) {
    return this.attr(name) != null;
  }
  insertAdjacentHTML(_position, html) {
    const childNodes = parseXml(`<root>${html}</root>`).find("/root/*");
    childNodes.forEach((node) => {
      this.addNextSibling(node);
    });
  }
  replaceWith(...nodes) {
    nodes.forEach((node) => {
      this.addPrevSibling(node);
    });
    this.remove();
  }
  removeAttribute(name) {
    var _a;
    (_a = this.attr(name)) == null ? void 0 : _a.remove();
  }
  setAttribute(name, value) {
    this.attr(name, value);
  }
  setAttributeNS(_namespaceURI, name, value) {
    this.attr(name, value);
  }
}
const { constructor: _, ...descriptors } = Object.getOwnPropertyDescriptors(
  DOMExtendedElement.prototype
);
Object.defineProperties(Element.prototype, descriptors);
export {
  DOMExtendedElement
};
//# sourceMappingURL=Element.js.map
