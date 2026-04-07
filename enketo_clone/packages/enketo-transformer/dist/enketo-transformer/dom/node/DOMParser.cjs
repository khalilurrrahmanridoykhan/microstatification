"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const libxslt = require("libxslt");
const { parseHtmlFragment, parseXml } = libxslt.libxmljs;
class DOMParser {
  constructor() {
    this.parseFromString = (docStr, mimeType) => {
      if (mimeType === "text/html") {
        return parseHtmlFragment(docStr);
      }
      return parseXml(docStr);
    };
  }
}
exports.DOMParser = DOMParser;
//# sourceMappingURL=DOMParser.cjs.map
