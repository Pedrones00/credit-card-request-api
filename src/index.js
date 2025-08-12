import express from "express";
import routes from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

routes(app).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running in http://localhost:${process.env.PORT}`);
  })
});