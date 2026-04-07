class XPathResult {
  constructor(results) {
    this.results = results;
  }
  get singleNodeValue() {
    return this.results[0] ?? null;
  }
  get snapshotLength() {
    return this.results.length;
  }
  snapshotItem(index) {
    return this.results[index];
  }
}
XPathResult.ORDERED_NODE_SNAPSHOT_TYPE = 6;
XPathResult.FIRST_ORDERED_NODE_TYPE = 9;
export {
  XPathResult
};
//# sourceMappingURL=XPathResult.js.map
