import express from "express";

export default function clienteRoutes(clienteController) {
    const routes = express.Router();

    routes.get('/clientes', (request, response) => clienteController.listAll(request, response));
    routes.get('/clientes/:id', (request, response) => clienteController.searchID(request, response));

    routes.post('/clientes', (request, response) => clienteController.register(request, response));
    routes.patch('/clientes', (request, response) => clienteController.updateCliente(request, response));
    routes.delete('/clientes/:id', (request, response) => clienteController.deleteCliente(request, response))

    return routes;
}