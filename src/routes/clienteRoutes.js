import express from "express";

export default function clienteRoutes(clienteController) {
  const routes = express.Router();

  routes.get("/clientes", async (request, response) => clienteController.indexPage(request, response));
  routes.get("/clientes/cadastrar", async (request, response) => clienteController.registerPage(request, response));
  routes.get("/clientes/visualizar/:id", async (request, response) => clienteController.viewPage(request, response));
  routes.get("/clientes/editar/:id", async (request, response) => clienteController.editPage(request, response));
  routes.get("/clientes/deletar/:id", async (request, response) => clienteController.deletePage(request, response));

  routes.get("/api/clientes", async (request, response) => clienteController.listAllAPI(request, response));
  routes.get("/api/clientes/:id", async (request, response) => clienteController.searchIDAPI(request, response));

  routes.post("/api/clientes", async (request, response) => clienteController.registerAPI(request, response));
  routes.patch("/api/clientes", async (request, response) => clienteController.updateClienteAPI(request, response));
  routes.patch("/api/clientes/:id/activate", async (request, response) => clienteController.activateClienteAPI(request, response));
  routes.delete("/api/clientes/:id", async (request, response) => clienteController.deleteClienteAPI(request, response));

  return routes;
}
