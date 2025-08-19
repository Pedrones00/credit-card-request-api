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
app.use(express.static("public"));

app.listen(8000, function () {
  console.log("O servidor está rodando no endereço http://localhost:8000");
});

// Simulação de um banco de dados
const clientes = [
  {
    id_cliente: 1,
    nome: "João da Silva",
    cpf: "123.456.789-00",
    email: "email@dominio.com",
    dt_nascimento: "1990-01-01",
    cpf_regular: 0, // 1 se o CPF estiver regular, 0 se irregular
    cliente_ativo: 1, // 1 se o cliente estiver ativo, 0 se inativo
  },
];
const cartoes = [
  {
    id_cartao: 1,
    nome: "Cartão do Brasil",
    tipo: "credito", // "credito" ou "debito"
    bandeira: "Elo",
    anuidade: 299.99,
  },
  {
    id_cartao: 2,
    nome: "Cartão dos Estados Unidos",
    tipo: "debito", // "credito" ou "debito"
    bandeira: "Visa",
    anuidade: 499.99,
  },
  {
    id_cartao: 3,
    nome: "Cartão da União Europeia",
    tipo: "debito", // "credito" ou "debito"
    bandeira: "Mastercard",
    anuidade: 575.0,
  },
];

// Rota para a página inicial
app.get("/", (request, response) => {
  response.render("index", { titulo: "Início" });
});

// Rota para visualizar todos os cartões registrados
app.get("/cartoes", (request, response) => {
  response.render("cartoes/index", {
    titulo: "Cartões",
    alerta: false,
    cartoes,
  });
});

// Rota para visualizar todos os clientes registrados
app.get("/clientes", (request, response) => {
  response.render("clientes/index", {
    titulo: "Clientes",
    alerta: false,
    clientes,
  });
});

// Rota para cadastrar um novo cartão
app.get("/cartoes/cadastrar", (request, response) => {
  response.render("cartoes/create", { titulo: "Cartões" });
});

// Rota para cadastrar um novo cliente
app.get("/clientes/cadastrar", (request, response) => {
  response.render("clientes/create", { titulo: "Clientes" });
});

// Rota para visualizar os dados de um cartão
app.get("/cartoes/visualizar/:id", (request, response) => {
  const id = Number(request.params.id);
  const cartao = cartoes.find((c) => c.id_cartao === id);

  if (!cartao) {
    return response.status(404).render("404");
  }

  response.render("cartoes/read", {
    titulo: "Cartões",
    cartao,
  });
});

// Rota para visualizar os dados de um cliente
app.get("/clientes/visualizar/:id", (request, response) => {
  const id = Number(request.params.id);
  const cliente = clientes.find((c) => c.id_cliente === id);

  if (!cliente) {
    return response.status(404).render("404");
  }

  response.render("clientes/read", {
    titulo: "Clientes",
    cliente,
  });
});

// Rota para editar os dados de um cartão
app.get("/cartoes/editar/:id", (request, response) => {
  const id = Number(request.params.id);
  const cartao = cartoes.find((c) => c.id_cartao === id);

  if (!cartao) {
    return response.status(404).render("404");
  }

  response.render("cartoes/update", {
    titulo: "Cartões",
    cartao,
  });
});

// Rota para editar os dados de um cliente
app.get("/clientes/editar/:id", (request, response) => {
  const id = Number(request.params.id);
  const cliente = clientes.find((c) => c.id_cliente === id);

  if (!cliente) {
    return response.status(404).render("404");
  }

  response.render("clientes/update", {
    titulo: "Clientes",
    cliente,
  });
});

// Rota para desativar um cartão
app.get("/cartoes/deletar/:id", (request, response) => {
  const id = Number(request.params.id);
  const cartao = cartoes.find((c) => c.id_cartao === id);

  if (!cartao) {
    return response.status(404).render("404");
  }

  response.render("cartoes/index", {
    titulo: "Cartões",
    alerta: true,
    cartoes,
  });
});

// Rota para desativar o registro de um cliente
app.get("/clientes/deletar/:id", (request, response) => {
  const id = Number(request.params.id);
  const cliente = clientes.find((c) => c.id_cliente === id);

  if (!cliente) {
    return response.status(404).render("404");
  }

  response.render("clientes/index", {
    titulo: "Clientes",
    alerta: true,
    clientes,
  });
});

// Middleware para rotas não encontradas (404)
app.use((request, response) => {
  response.status(404).render("404", { titulo: "Página não encontrada" });
});

/*
routes(app);

app.listen(process.env.PORT, () => {
  console.log(`Server running in http://localhost:${process.env.PORT}`);
});
*/
