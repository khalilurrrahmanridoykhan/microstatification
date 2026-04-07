const markdownToHTML = (text) => {
  const html = text.replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(
    /&lt;\s?span([^/\n]*)&gt;((?:(?!&lt;\/).)+)&lt;\/\s?span\s?&gt;/gm,
    createSpan
  ).replace(
    /&lt;\s?sup(?:[^/\n]*)&gt;((?:(?!&lt;\/).)+)&lt;\/\s?sup\s?&gt;/gm,
    createSup
  ).replace(
    /&lt;\s?sub(?:[^/\n]*)&gt;((?:(?!&lt;\/).)+)&lt;\/\s?sub\s?&gt;/gm,
    createSub
  ).replace(/&/gm, "&amp;").replace(/\\\\/gm, "&92;").replace(/\\\*/gm, "&42;").replace(/\\_/gm, "&95;").replace(/\\#/gm, "&35;").replace(/__(.*?)__/gm, "<strong>$1</strong>").replace(/\*\*(.*?)\*\*/gm, "<strong>$1</strong>").replace(/(^|\W)_([^\s][^_\n]*)_(\W|$)/gm, "$1<em>$2</em>$3").replace(/\*([^\s][^*\n]*)\*/gm, "<em>$1</em>").replace(/\[([^\]]*)\]\(([^)]+)\)/gm, createAnchor).replace(/^\s*(#{1,6})\s?([^#][^\n]*)(\n|$)/gm, createHeader).replace(/^((\*|\+|-) (.*)(\n|$))+/gm, createUnorderedList).replace(/(\n([0-9]+\.) (.*))+$/gm, createOrderedList).replace(/\n(<ul>)/gm, "$1").replace(/&35;/gm, "#").replace(/&95;/gm, "_").replace(/&92;/gm, "\\").replace(/&42;/gm, "*").replace(/&amp;/gm, "&").replace(/([^\n]+)\n{2,}/gm, createParagraph).replace(/([^\n]+)\n/gm, "$1<br>");
  return html;
};
const ignoreMatch = (fn) => {
  return (_match, ...args) => fn(...args);
};
const createAnchor = ignoreMatch(
  (label, href) => `<a href="${encodeURI(
    href
  )}" rel="noopener" target="_blank">${label}</a>`
);
const createHeader = ignoreMatch((hashtags, content) => {
  const level = hashtags.length;
  return `<h${level}>${content.replace(/#+$/, "")}</h${level}>`;
});
const createUnorderedList = (match) => {
  const items = match.replace(/(?:\*|\+|-)(.*)\n?/gm, createItem);
  return `<ul>${items}</ul>`;
};
const createOrderedList = (match) => {
  const startMatches = match.match(/^\n?(?<start>[0-9]+)\./);
  const start = startMatches && startMatches.groups && startMatches.groups.start !== "1" ? ` start="${startMatches.groups.start}"` : "";
  const items = match.replace(/\n?(?:[0-9]+\.)(.*)/gm, createItem);
  return `<ol${start}>${items}</ol>`;
};
const createItem = ignoreMatch(
  (content) => `<li>${content.trim()}</li>`
);
const createParagraph = ignoreMatch((line) => {
  const trimmed = line.trim();
  if (/^<\/?(ul|ol|li|h|p)/i.test(trimmed)) {
    return line;
  }
  return `<p>${trimmed}</p>`;
});
const createSpan = ignoreMatch((attributes, content) => {
  const sanitizedAttributes = sanitizeAttributes(attributes);
  return `<span${sanitizedAttributes}>${content}</span>`;
});
const createSup = ignoreMatch((content) => `<sup>${content}</sup>`);
const createSub = ignoreMatch((content) => `<sub>${content}</sub>`);
const sanitizeAttributes = (attributes) => {
  const styleMatches = attributes.match(/( style=(["'])[^"']*\2)/);
  const style = styleMatches && styleMatches.length ? styleMatches[0] : "";
  return style;
};
export {
  markdownToHTML
};
//# sourceMappingURL=markdown.js.map
