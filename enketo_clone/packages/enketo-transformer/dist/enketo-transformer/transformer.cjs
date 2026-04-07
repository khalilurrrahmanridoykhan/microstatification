"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
require("./dom/node/Document.cjs");
require("./dom/node/Node.cjs");
require("./dom/node/Element.cjs");
const XPathResult = require("./dom/node/XPathResult.cjs");
const DOMParser = require("./dom/node/DOMParser.cjs");
const XSLTProcessor = require("./dom/node/XSLTProcessor.cjs");
const shared$1 = require("./dom/shared.cjs");
const openrosa2html5form = require("./xsl/openrosa2html5form.xsl.cjs");
const openrosa2xmlmodel = require("./xsl/openrosa2xmlmodel.xsl.cjs");
const language = require("./language.cjs");
const markdown = require("./markdown.cjs");
const shared = require("./shared.cjs");
const url = require("./url.cjs");
const getPreprocess = (survey) => {
  if (String("node") === "node" && typeof survey.preprocess === "function") {
    return survey.preprocess;
  }
};
const transform = async (survey) => {
  const { xform, markdown: markdown2, media, openclinica, theme } = survey;
  const xsltParams = openclinica ? {
    openclinica: 1
  } : {};
  const mediaMap = Object.fromEntries(
    Object.entries(media || {}).map((entry) => entry.map(url.escapeURLPath))
  );
  const domParser = new DOMParser.DOMParser();
  const xslFormDoc = domParser.parseFromString(openrosa2html5form.default, "text/xml");
  let xformDoc = domParser.parseFromString(xform, "text/xml");
  const preprocess = getPreprocess(survey);
  if (typeof preprocess === "function") {
    const { libxmljs } = await import("libxslt");
    xformDoc = preprocess.call(libxmljs, xformDoc);
  }
  processBinaryDefaults(xformDoc, mediaMap);
  processItemsets(xformDoc);
  const htmlDoc = xslTransform(xslFormDoc, xformDoc, xsltParams);
  correctHTMLDocHierarchy(htmlDoc);
  correctAction(htmlDoc, "setgeopoint");
  correctAction(htmlDoc, "setvalue");
  transformAppearances(htmlDoc);
  replaceTheme(htmlDoc, theme);
  replaceMediaSources(htmlDoc, mediaMap);
  const languageMap = replaceLanguageTags(htmlDoc);
  const form = markdown2 !== false ? renderMarkdown(htmlDoc, mediaMap) : docToString(htmlDoc);
  const xslModelDoc = domParser.parseFromString(openrosa2xmlmodel.default, "text/xml");
  const xmlDoc = xslTransform(xslModelDoc, xformDoc);
  correctModelNamespaces(xslModelDoc, xformDoc, xmlDoc);
  replaceMediaSources(xmlDoc, mediaMap);
  addInstanceIdNodeIfMissing(xmlDoc);
  const model = docToString(xmlDoc);
  delete survey.xform;
  delete survey.media;
  delete survey.preprocess;
  delete survey.markdown;
  delete survey.openclinica;
  return Object.assign(survey, {
    form,
    model,
    languageMap,
    transformerVersion: "4.2.0"
  });
};
const xslTransform = (xslDoc, xmlDoc, xsltParams = {}) => {
  const xsltProcessor = new XSLTProcessor.XSLTProcessor();
  xsltProcessor.importStylesheet(xslDoc);
  Object.entries(xsltParams).forEach(([key, value]) => {
    xsltProcessor.setParameter(null, key, value);
  });
  return xsltProcessor.transformToDocument(xmlDoc);
};
const getNamespaceResolver = (namespaces) => ({
  lookupNamespaceURI: (prefix) => namespaces[prefix] ?? null
});
const isDocument = (node) => node.nodeType === shared$1.NodeTypes.DOCUMENT_NODE;
const evaluateXPathExpression = (context, expression, resultType, namespaces) => {
  const namespaceResolver = namespaces == null ? null : getNamespaceResolver(namespaces);
  const doc = isDocument(context) ? context : context.ownerDocument;
  if (doc == null) {
    throw new Error("Could not find owner document");
  }
  return doc.evaluate(expression, context, namespaceResolver, resultType);
};
const getNodesByXPathExpression = (context, expression, namespaces) => {
  var _a;
  const results = [];
  const result = evaluateXPathExpression(
    context,
    expression,
    XPathResult.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    namespaces
  );
  for (let i = 0; i < (result.snapshotLength ?? 0); i += 1) {
    results.push((_a = result.snapshotItem) == null ? void 0 : _a.call(result, i));
  }
  return results;
};
const getNodeByXPathExpression = (context, expression, namespaces) => {
  const { singleNodeValue } = evaluateXPathExpression(
    context,
    expression,
    XPathResult.XPathResult.FIRST_ORDERED_NODE_TYPE,
    namespaces
  );
  return singleNodeValue;
};
const processBinaryDefaults = (doc, mediaMap) => {
  getNodesByXPathExpression(
    doc,
    '/h:html/h:head/xmlns:model/xmlns:bind[@type="binary"]',
    shared.NAMESPACES
  ).forEach((bind) => {
    const nodeset = bind.getAttribute("nodeset");
    if (nodeset) {
      const path = `/h:html/h:head/xmlns:model/xmlns:instance${nodeset.replace(
        /\//g,
        "/xmlns:"
      )}`;
      const dataNode = getNodeByXPathExpression(doc, path, shared.NAMESPACES);
      if (dataNode) {
        const text = dataNode.textContent ?? "";
        if (/^[a-zA-Z]+:\/\//.test(text)) {
          const value = url.getMediaPath(mediaMap, text);
          const escapedText = url.escapeURLPath(text);
          dataNode.setAttribute("src", value);
          dataNode.textContent = escapedText;
        }
      }
    }
  });
};
const correctAction = (doc, localName = "setvalue") => {
  getNodesByXPathExpression(
    doc,
    `//*[contains(@class, "question")]//label/input[@data-${localName}]`
  ).forEach((setValueEl) => {
    const { parentElement } = setValueEl;
    if (parentElement != null) {
      const clone = setValueEl.cloneNode(true);
      parentElement.replaceWith(clone);
    }
  });
  getNodesByXPathExpression(
    doc,
    `//label[contains(@class, "${localName}")]/input[@data-${localName}]`
  ).forEach((setValueEl) => {
    var _a;
    const name = setValueEl.getAttribute("name");
    const questionSameName = getNodeByXPathExpression(
      doc,
      `//*[@name="${name}" and ( contains(../@class, 'question') or contains(../../@class, 'option-wrapper')) and not(@type='hidden')]`
    );
    if (questionSameName) {
      [`data-${localName}`, "data-event"].forEach((name2) => {
        questionSameName.setAttribute(
          name2,
          setValueEl.getAttribute(name2) ?? name2
        );
      });
      (_a = setValueEl.parentElement) == null ? void 0 : _a.remove();
    }
  });
};
const replaceTheme = (doc, theme) => {
  const HAS_THEME = /(theme-)[^"'\s]+/;
  if (!theme) {
    return;
  }
  const form = getNodeByXPathExpression(doc.documentElement, "/root/form");
  if (form == null) {
    throw new Error("Form is missing");
  }
  const formClass = form.getAttribute("class");
  if (formClass != null && HAS_THEME.test(formClass)) {
    form.setAttribute("class", formClass.replace(HAS_THEME, `$1${theme}`));
  } else {
    form.setAttribute("class", `${formClass ?? ""} theme-${theme}`);
  }
};
const replaceMediaSources = (root, mediaMap) => {
  if (!mediaMap) {
    return;
  }
  getNodesByXPathExpression(root, "//*[@src] | //a[@href]").forEach(
    (mediaEl) => {
      const attribute = mediaEl.nodeName.toLowerCase() === "a" ? "href" : "src";
      const src = mediaEl.getAttribute(attribute);
      if (src == null) {
        return;
      }
      const replacement = url.getMediaPath(mediaMap, src);
      if (replacement) {
        mediaEl.setAttribute(attribute, replacement);
      }
    }
  );
  const formLogo = mediaMap["form_logo.png"];
  const formLogoEl = getNodeByXPathExpression(
    root,
    '//*[@class="form-logo"]'
  );
  if (formLogo && formLogoEl) {
    const formLogoImg = root.createElement("img");
    formLogoImg.setAttribute("src", formLogo);
    formLogoImg.setAttribute("alt", "form logo");
    formLogoEl.append(formLogoImg);
  }
};
const replaceLanguageTags = (doc) => {
  const languageMap = {};
  const languageElements = getNodesByXPathExpression(
    doc,
    '/root/form/select[@id="form-languages"]/option'
  );
  const languages = languageElements.map((el) => {
    const lang = el.textContent ?? "";
    return language.parseLanguage(lang, getLanguageSampleText(doc, lang));
  });
  if (languages.length === 0) {
    languages.push(language.parseLanguage("", getLanguageSampleText(doc, "")));
  }
  languageElements.forEach((el, index) => {
    const val = el.getAttribute("value");
    if (val && val !== languages[index].tag) {
      languageMap[val] = languages[index].tag;
    }
    el.setAttribute("data-dir", languages[index].directionality);
    el.setAttribute("value", languages[index].tag);
    el.textContent = languages[index].description;
  });
  languages.forEach(({ sourceLanguage, tag }) => {
    if (sourceLanguage === tag) {
      return;
    }
    getNodesByXPathExpression(
      doc,
      `/root/form//*[@lang="${sourceLanguage}"]`
    ).forEach((el) => {
      el.setAttribute("lang", tag);
    });
  });
  const langSelectorElement = getNodeByXPathExpression(
    doc,
    "/root/form/*[@data-default-lang]"
  );
  if (langSelectorElement) {
    const defaultLang = langSelectorElement.getAttribute("data-default-lang");
    languages.some(({ sourceLanguage, tag }) => {
      if (sourceLanguage === defaultLang) {
        langSelectorElement.setAttribute("data-default-lang", tag);
        return true;
      }
      return false;
    });
  }
  return languageMap;
};
const getLanguageSampleText = (doc, language2) => {
  var _a;
  const langSampleEl = getNodeByXPathExpression(
    doc,
    `/root/form//span[contains(@class, "or-hint") and @lang="${language2}" and normalize-space() and not(./text() = '-')]`
  ) || getNodeByXPathExpression(
    doc,
    `/root/form//span[@lang="${language2}" and normalize-space() and not(./text() = '-')]`
  );
  return ((_a = langSampleEl == null ? void 0 : langSampleEl.textContent) == null ? void 0 : _a.trim()) || "nothing";
};
const addInstanceIdNodeIfMissing = (doc) => {
  const xformsPath = "/xmlns:root/xmlns:model/xmlns:instance/*/xmlns:meta/xmlns:instanceID";
  const openrosaPath = "/xmlns:root/xmlns:model/xmlns:instance/*/orx:meta/orx:instanceID";
  const instanceIdEl = getNodeByXPathExpression(
    doc,
    `${xformsPath} | ${openrosaPath}`,
    shared.NAMESPACES
  );
  if (!instanceIdEl) {
    const rootEl = getNodeByXPathExpression(
      doc,
      "/xmlns:root/xmlns:model/xmlns:instance/*",
      shared.NAMESPACES
    );
    const metaEl = getNodeByXPathExpression(
      doc,
      "/xmlns:root/xmlns:model/xmlns:instance/*/xmlns:meta",
      shared.NAMESPACES
    );
    const instanceID = doc.createElementNS(shared.NAMESPACES.xmlns, "instanceID");
    if (metaEl) {
      metaEl.append(instanceID);
    } else if (rootEl) {
      const meta = doc.createElementNS(shared.NAMESPACES.xmlns, "meta");
      rootEl.append(meta);
      meta.append(instanceID);
    }
  }
};
const renderMarkdown = (htmlDoc, mediaMap) => {
  const replacements = {};
  getNodesByXPathExpression(
    htmlDoc,
    '/root/form//span[contains(@class, "or-output")]'
  ).forEach((el, index) => {
    const key = `---output-${index}`;
    const textNode = el.firstChild.cloneNode(true);
    replacements[key] = el.outerHTML;
    textNode.textContent = key;
    el.replaceWith(textNode);
  });
  const domParser = new DOMParser.DOMParser();
  getNodesByXPathExpression(
    htmlDoc,
    '/root/form//span[contains(@class, "question-label") or contains(@class, "or-hint")]'
  ).forEach((el, index) => {
    let key;
    const original = el.textContent.replace("<", "&lt;").replace(">", "&gt;");
    let rendered = markdown.markdownToHTML(original);
    if (original !== rendered) {
      const tempDoc = domParser.parseFromString(
        `<root class="temporary-root">${rendered}</root>`,
        "text/html"
      );
      correctHTMLDocHierarchy(tempDoc);
      replaceMediaSources(tempDoc, mediaMap);
      rendered = docToString(tempDoc);
      key = `$$$${index}`;
      replacements[key] = rendered;
      el.textContent = key;
    }
  });
  let htmlStr = docToString(htmlDoc);
  Object.keys(replacements).reverse().forEach((key) => {
    const replacement = replacements[key];
    if (replacement) {
      htmlStr = htmlStr.replace(key, () => replacement);
    }
  });
  return htmlStr;
};
const docToString = (doc) => {
  const { outerHTML } = doc.documentElement;
  return outerHTML.replace(/^<[^>]+>/, "").replace(/<\/[^>]+>(?!.|\n)$/, "");
};
const version = "b56f916619066a31f8b9d1530784c257";
const sheets = {
  xslForm: openrosa2html5form.default,
  xslModel: openrosa2xmlmodel.default
};
var transformer_default = {
  transform,
  version: "b56f916619066a31f8b9d1530784c257",
  NAMESPACES: shared.NAMESPACES,
  sheets,
  escapeURLPath: url.escapeURLPath
};
const correctHTMLDocHierarchy = (doc) => {
  const { documentElement } = doc;
  if (documentElement.nodeName.toLowerCase() === "html") {
    const root = getNodeByXPathExpression(doc, "/html/body/root");
    if (root == null) {
      throw new Error("Missing root node.");
    }
    documentElement.replaceWith(root);
  }
};
const substringBefore = (haystack, needle) => haystack.split(needle, 1)[0];
const substringAfter = (haystack, needle) => haystack.substring(haystack.indexOf(needle) + needle.length);
const stripFilter = (expression) => expression.replace(/\[.*?\]/g, "");
const processItemsets = (xformDoc) => {
  const itemsets = getNodesByXPathExpression(
    xformDoc,
    "//xmlns:itemset",
    shared.NAMESPACES
  );
  itemsets.forEach((itemset) => {
    const valueEl = getNodeByXPathExpression(
      itemset,
      "./xmlns:value",
      shared.NAMESPACES
    );
    const valueRef = (valueEl == null ? void 0 : valueEl.getAttribute("ref")) ?? "";
    const labelEl = getNodeByXPathExpression(
      itemset,
      "./xmlns:label",
      shared.NAMESPACES
    );
    const labelRef = (labelEl == null ? void 0 : labelEl.getAttribute("ref")) ?? "";
    const nodeset = itemset.getAttribute("nodeset") ?? "";
    const iwq = substringBefore(substringAfter(nodeset, "instance("), ")");
    let instancePathTemp;
    const nodesetIncludesRandomize = nodeset.includes("randomize(");
    if (nodesetIncludesRandomize && nodeset.includes(",")) {
      instancePathTemp = substringBefore(
        substringAfter(nodeset, ")"),
        ","
      );
    } else if (nodesetIncludesRandomize) {
      instancePathTemp = substringBefore(
        substringAfter(nodeset, ")"),
        ")"
      );
    } else {
      instancePathTemp = substringAfter(nodeset, ")");
    }
    const instancePath = instancePathTemp.replace(/\//g, "/xf:");
    const instancePathNoFilter = stripFilter(instancePath);
    const instanceId = iwq.substring(1, iwq.length - 1);
    const itextPath = `/h:html/h:head/xf:model/xf:instance[@id="${instanceId}"]${instancePathNoFilter}`;
    itemset.setAttribute("valueRef", valueRef);
    itemset.setAttribute("labelRef", labelRef);
    itemset.setAttribute("itextPath", `${itextPath}`);
    const [, labelNodeName] = labelRef.match(/itext\((.*)\)/) ?? [];
    if (labelNodeName != null) {
      const labelPath = `${itextPath.replace(
        /\/xf:/g,
        "/xmlns:"
      )}/*[name() = "${labelNodeName}"]`;
      const items = getNodesByXPathExpression(
        xformDoc,
        labelPath,
        shared.NAMESPACES
      );
      itemset.append(...items.map((item) => item.cloneNode(true)));
    }
  });
};
const transformAppearances = (doc) => {
  const appearanceElements = getNodesByXPathExpression(
    doc,
    "//*[@data-appearances]"
  );
  appearanceElements.forEach((element) => {
    var _a, _b, _c;
    const selectType = element.hasAttribute("data-appearances-select-type");
    if (selectType) {
      element.removeAttribute("data-appearances-select-type");
    }
    const appearances = ((_a = element.getAttribute("data-appearances")) == null ? void 0 : _a.trim().toLowerCase().split(/\s+/)) ?? [];
    const appearanceClasses = appearances.flatMap((appearance) => {
      const results = [`or-appearance-${appearance}`];
      if (selectType) {
        if (appearance === "horizontal") {
          results.push("or-appearance-columns");
        }
        if (appearance === "horizontal-compact") {
          results.push("or-appearance-columns-pack");
        }
        if (appearance === "compact") {
          results.push(
            "or-appearance-columns-pack",
            "or-appearance-no-buttons"
          );
        }
        if (appearance.startsWith("compact-")) {
          results.push(
            appearance.replace("compact-", ""),
            "or-appearance-no-buttons"
          );
        }
      }
      return results;
    });
    const classes = ((_c = (_b = element.getAttribute("class")) == null ? void 0 : _b.trim()) == null ? void 0 : _c.split(/\s+/)) ?? [];
    const className = classes.flatMap(
      (className2) => className2 === "or-appearances-placeholder" ? appearanceClasses : className2
    ).join(" ");
    element.setAttribute("class", className);
    element.removeAttribute("data-appearances");
  });
};
const XMLNS_URI = "http://www.w3.org/2000/xmlns/";
const correctModelNamespaces = (xslDoc, xformDoc, modelDoc) => {
  var _a;
  if (typeof document === "undefined") {
    return;
  }
  const { documentElement: xslRoot } = xslDoc;
  const instanceRoots = getNodesByXPathExpression(
    modelDoc,
    "/xmlns:root/xmlns:model/xmlns:instance/*",
    shared.NAMESPACES
  );
  const model = (_a = instanceRoots[0].parentElement) == null ? void 0 : _a.parentElement;
  const xformModel = getNodeByXPathExpression(
    xformDoc,
    "/h:html/h:head/xmlns:model",
    shared.NAMESPACES
  );
  if (model == null || xformModel == null) {
    throw new Error("XForm is missing a model element.");
  }
  instanceRoots.forEach((instanceRoot) => {
    const xformModelAttrNamespaces = [...xformModel.attributes].filter(
      ({ name }) => name !== "xmlns" && !name.startsWith("xmlns:")
    ).map(({ namespaceURI }) => namespaceURI);
    const missingNamespaceAttrs = [
      ...xformDoc.documentElement.attributes
    ].filter(
      ({ name, value }) => (name === "xmlns" || name.startsWith("xmlns:")) && !xslRoot.hasAttribute(name) && !xformModelAttrNamespaces.includes(value) && !instanceRoot.hasAttribute(name)
    );
    missingNamespaceAttrs.forEach(({ name, value }) => {
      instanceRoot.setAttributeNS(XMLNS_URI, name, value);
    });
  });
};
exports.NAMESPACES = shared.NAMESPACES;
exports.escapeURLPath = url.escapeURLPath;
exports.default = transformer_default;
exports.sheets = sheets;
exports.transform = transform;
exports.version = version;
//# sourceMappingURL=transformer.cjs.map
