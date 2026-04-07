import bodyParser from "body-parser";
import express from "express";
import config from "./config/config.json.js";
import { api } from "./api.js";
const app = express();
Object.entries(config).forEach(([key, value]) => {
  app.set(key, value);
});
app.post("/", bodyParser.json());
app.post(
  "/",
  bodyParser.urlencoded({
    extended: true
  })
);
api(app);
const { port } = config;
app.listen(port, () => {
  console.warn(`enketo-transformer running on port ${port}!`);
});
//# sourceMappingURL=app.js.map
