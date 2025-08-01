import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
// import routes from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.listen(8000, function () {
  console.log("O servidor está rodando no endereço http://localhost:8000");
});

// Rota para a página inicial
app.get("/", (request, response) => {
  response.render("index", { title: "Home" });
});

// Middleware para rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).render("404", { title: "Página não encontrada" });
});

/*
routes(app);

app.listen(process.env.PORT, () => {
  console.log(`Server running in http://localhost:${process.env.PORT}`);
});
*/
