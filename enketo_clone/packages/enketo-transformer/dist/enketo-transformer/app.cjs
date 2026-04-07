"use strict";
const bodyParser = require("body-parser");
const express = require("express");
const config = require("./config/config.json.cjs");
const api = require("./api.cjs");
const app = express();
Object.entries(config.default).forEach(([key, value]) => {
  app.set(key, value);
});
app.post("/", bodyParser.json());
app.post(
  "/",
  bodyParser.urlencoded({
    extended: true
  })
);
api.api(app);
const { port } = config.default;
app.listen(port, () => {
  console.warn(`enketo-transformer running on port ${port}!`);
});
//# sourceMappingURL=app.cjs.map
