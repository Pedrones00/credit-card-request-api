import express from "express";

export default function contratoRouter(contratoController) {
    const routes = express.Router();

    routes.get('/contrato', (request, response) => contratoController.listAll(request, response));
    routes.get('/contrato/:id', (request, response) => contratoController.searchID(request, response));

    routes.post('/contrato', (request, response) => contratoController.register(request, response));
    routes.patch('/contrato', (request, response) => contratoController.update(request, response));
    routes.delete('/contrato/:id', (request, response) => contratoController.delete(request, response))

    return routes;
}