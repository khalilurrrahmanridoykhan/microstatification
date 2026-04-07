"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const express = require("express");
const fs = require("fs");
const path = require("path");
const undici = require("undici");
const url = require("url");
const transformer = require("./transformer.cjs");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const router = express.Router();
class FetchError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const getXForm = async (req) => {
  const { xform } = req.query;
  try {
    if (typeof xform !== "string") {
      throw new FetchError(
        400,
        "An `xform` query parameter is required."
      );
    }
    if (!xform.includes("/")) {
      const basePath = path.resolve(
        path.dirname(url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("enketo-transformer/api.cjs", document.baseURI).href)),
        "../"
      );
      const paths = [
        path.resolve(basePath, "./test/forms", xform),
        path.resolve(
          basePath,
          "./test/external-fixtures/enketo-core",
          xform
        )
      ];
      for (const path2 of paths) {
        try {
          return fs.readFileSync(path2, "utf-8");
        } catch {
        }
      }
      throw new FetchError(400, `Could not find XForm: ${xform}`);
    }
    const response = await undici.request(xform, {
      headers: {
        "X-OpenRosa-Version": "1.0"
      }
    });
    const { statusCode } = response;
    if (statusCode === 401) {
      throw new FetchError(
        statusCode,
        "Forbidden. Authorization Required."
      );
    }
    if (statusCode < 200 || statusCode >= 300) {
      throw new FetchError(statusCode, `Request to ${xform} failed.`);
    }
    return response.body.text();
  } catch (error) {
    console.error(`Error occurred when requesting ${xform}`, error);
    if (error instanceof Error && !(error instanceof FetchError)) {
      throw new FetchError(500, error.message ?? "Unknown error.");
    }
    throw error;
  }
};
const getTransformedSurvey = async (req) => {
  const isPost = req.method === "POST";
  const payload = isPost ? req.body : req.query;
  const { markdown, openclinica, theme } = payload;
  const media = isPost ? payload.media : {};
  const xform = req.method === "POST" ? payload.xform : await getXForm(req);
  return transformer.transform({
    xform,
    markdown: markdown !== "false",
    openclinica: openclinica === "true",
    media,
    theme
  });
};
router.all("/", (req, res, next) => {
  try {
    if (req.app.get("secure")) {
      throw new FetchError(405, "Not Allowed.");
    }
    const payload = req.method === "POST" ? req.body : req.query;
    if (payload.xform == null) {
      throw new FetchError(400, "Bad Request.");
    }
    res.set("Access-Control-Allow-Origin", "*");
    next();
  } catch (error) {
    next(error);
  }
}).get("/", async (req, res, next) => {
  try {
    const survey = await getTransformedSurvey(req);
    res.json(survey);
  } catch (error) {
    next(error);
  }
}).post("/", async (req, res, next) => {
  try {
    const survey = await getTransformedSurvey(req);
    res.json(survey);
  } catch (error) {
    next(error);
  }
}).get("/htmlform", async (req, res, next) => {
  try {
    const { form } = await getTransformedSurvey(req);
    res.set("Content-Type", "text/html");
    res.end(form);
  } catch (error) {
    next(error);
  }
});
const errorHandler = (error, _req, res) => {
  if (error instanceof FetchError) {
    res.status(error.status).send(
      `${error.message} (stack: ${error.stack})`
    );
  } else {
    res.status(500).send(`Unknown error: ${error}`);
  }
};
const api = (app) => {
  app.use("/transform", router, errorHandler);
};
exports.api = api;
//# sourceMappingURL=api.cjs.map
