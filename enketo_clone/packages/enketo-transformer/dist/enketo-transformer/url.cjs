"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const TEMPORARY_HOST = "http://example.com";
const escapeURLPath = (value) => {
  const [scheme] = value.match(/^[a-z]+:/) ?? [];
  const isFullyQualified = scheme != null;
  const urlString = isFullyQualified ? value.replace(/^jr:\/*/, "http://") : `${TEMPORARY_HOST}/${value.replace(/^\//, "")}`;
  const url = new URL(urlString);
  if (isFullyQualified) {
    return url.href.replace("http:", scheme);
  }
  const { pathname, search } = url;
  const path = value.startsWith("/") ? pathname : pathname.replace(/^\//, "");
  return `${path}${search}`;
};
const getMediaPath = (mediaMap, mediaURL) => {
  const mediaPath = mediaURL.match(/jr:\/\/[\w-]+\/(.+)/);
  if (mediaPath == null) {
    return escapeURLPath(mediaURL);
  }
  const path = escapeURLPath(mediaPath[1]);
  const value = mediaMap[path];
  return value || escapeURLPath(mediaURL);
};
exports.escapeURLPath = escapeURLPath;
exports.getMediaPath = getMediaPath;
//# sourceMappingURL=url.cjs.map
