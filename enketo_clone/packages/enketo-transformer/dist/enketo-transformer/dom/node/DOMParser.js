import { libxmljs } from "libxslt";
const { parseHtmlFragment, parseXml } = libxmljs;
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
export {
  DOMParser
};
//# sourceMappingURL=DOMParser.js.map
