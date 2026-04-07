"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const tags = require("language-tags");
const stringDirection = require("string-direction");
class Language {
  constructor(sourceLanguage, description, tag, directionality) {
    this.sourceLanguage = sourceLanguage;
    this.description = description;
    this.tag = tag;
    this.directionality = directionality;
  }
}
const parseLanguage = (sourceLanguage, sample) => {
  const directionality = getDirectionality(sample);
  let description = sourceLanguage.trim();
  let tag = description;
  const parts = sourceLanguage.match(/^([^(]+)\((.*)\)\s*$/);
  if (parts && parts.length >= 2) {
    return new Language(
      sourceLanguage,
      parts[1].trim(),
      parts[2].trim(),
      directionality
    );
  }
  const languageFromTag = getLanguageFromSubtag(sourceLanguage.split("-")[0]);
  if (languageFromTag == null) {
    const language = getLanguageFromDescription(description);
    if (typeof language === "object" && language.data.subtag != null) {
      tag = language.data.subtag;
    }
  } else {
    description = languageFromTag.descriptions()[0];
  }
  return new Language(sourceLanguage, description, tag, directionality);
};
const getLanguageFromDescription = (description) => description.trim() === "" ? "" : tags.search(description).find(isLanguage) ?? "";
const getLanguageFromSubtag = (subtag) => subtag.trim() === "" ? null : tags.subtags(subtag).find(isLanguage) ?? null;
const isLanguage = (object) => object.data.type === "language";
const getDirectionality = (sample) => {
  const direction = stringDirection.getDirection(sample);
  if (direction !== "ltr") {
    return "rtl";
  }
  return direction;
};
exports.Language = Language;
exports.parseLanguage = parseLanguage;
//# sourceMappingURL=language.cjs.map
