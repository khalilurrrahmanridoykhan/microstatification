"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const libxslt = require("libxslt");
class XSLTProcessor {
  constructor() {
    this.parameters = {};
    this.stylesheet = null;
  }
  importStylesheet(xsltDoc) {
    try {
      this.stylesheet = libxslt.parse(xsltDoc);
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
exports.XSLTProcessor = XSLTProcessor;
//# sourceMappingURL=XSLTProcessor.cjs.map
