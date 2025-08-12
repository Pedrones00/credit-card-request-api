import express from "express";

export default function cartaoRoutes(cartaoController) {
    const routes = express.Router();

    routes.get('/cartoes', async (request, response) => cartaoController.indexPage(request, response));
    routes.get("/cartoes/cadastrar", (request, response) => cartaoController.registerPage(request, response));
    routes.get("/cartoes/visualizar/:id", async (request, response) => cartaoController.viewPage(request, response));
    routes.get("/cartoes/editar/:id", async (request, response) => cartaoController.editPage(request, response));
    routes.get("/cartoes/deletar/:id", (request, response) => cartaoController.deletePage(request, response));
    
    routes.get('/api/cartoes', (request, response) => cartaoController.listAll(request, response, true));
    routes.get('/api/cartoes/:id', (request, response) => cartaoController.searchID(request, response, true));

    routes.post('/api/cartoes', (request, response) => cartaoController.register(request, response));
    routes.patch('/api/cartoes', (request, response) => cartaoController.updateCartao(request, response));
    routes.delete('/api/cartoes/:id', (request, response) => cartaoController.deleteCartao(request, response, true));
    
    return routes;
}