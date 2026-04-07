import { parse } from "libxslt";
class XSLTProcessor {
  constructor() {
    this.parameters = {};
    this.stylesheet = null;
  }
  importStylesheet(xsltDoc) {
    try {
      this.stylesheet = parse(xsltDoc);
    } catch (error) {
      console.error(error, "xsl", xsltDoc.toString());
      throw error;
    }
  }
  reset() {
    this.parameters = {};
    this.stylesheet = null;
  }
  setParameter(_namespaceURI, name, value) {
    this.parameters[name] = value;
  }
  transformToDocument(xmlDoc) {
    if (this.stylesheet == null) {
      throw new Error("`importStylesheet` must be called.");
    }
    return this.stylesheet.apply(xmlDoc, this.parameters);
  }
}
export {
  XSLTProcessor
};
//# sourceMappingURL=XSLTProcessor.js.map
