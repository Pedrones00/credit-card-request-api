import express from "express";

export default function contratoRouter(contratoController) {
    const routes = express.Router();

    routes.get('/api/contratos', (request, response) => contratoController.listAllAPI(request, response));
    routes.get('/api/contratos/:id', (request, response) => contratoController.searchIDAPI(request, response));

    routes.post('/api/contratos', (request, response) => contratoController.registerAPI(request, response));
    routes.patch('/api/contratos', (request, response) => contratoController.updateAPI(request, response));
    routes.delete('/api/contratos/:id', (request, response) => contratoController.deleteAPI(request, response));

    return routes;
}