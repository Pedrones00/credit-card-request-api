import express from "express";

export default function cartaoRoutes(cartaoController) {
    const routes = express.Router();

    routes.get('/cartao', (request, response) => cartaoController.listAll(request, response));
    routes.get('/cartao/:id', (request, response) => cartaoController.searchID(request, response));

    routes.post('/cartao', (request, response) => cartaoController.register(request, response));
    routes.patch('/cartao', (request, response) => cartaoController.updateCartao(request, response));
    routes.delete('/cartao/:id', (request, response) => cartaoController.deleteCartao(request, response));

    return routes;
}