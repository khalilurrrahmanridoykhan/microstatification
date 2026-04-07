import { ENKETO_API_KEY, ENKETO_AUTH_SCHEME } from "../config";

const encodeBasic = (value) => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(value);
  }
  if (typeof btoa === "function") {
    return btoa(value);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }
  throw new Error("Base64 encoder is not available in this environment.");
};

export const getEnketoAuthHeader = () => {
  if (!ENKETO_API_KEY) {
    throw new Error("ENKETO_API_KEY is not configured.");
  }
  const scheme = (ENKETO_AUTH_SCHEME || "token").trim().toLowerCase();
  if (scheme === "basic") {
    return `Basic ${encodeBasic(`${ENKETO_API_KEY}:`)}`;
  }
  if (scheme === "bearer") {
    return `Bearer ${ENKETO_API_KEY}`;
  }
  return `Token ${ENKETO_API_KEY}`;
};

export const getEnketoFormId = (formId) =>
  formId && `${formId}`.startsWith("form_") ? formId : `form_${formId}`;
