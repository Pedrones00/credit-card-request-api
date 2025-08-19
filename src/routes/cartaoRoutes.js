import express from "express";

export default function cartaoRoutes(cartaoController) {
    const routes = express.Router();

    routes.get('/cartoes', async (request, response) => cartaoController.indexPage(request, response));
    routes.get("/cartoes/cadastrar", async (request, response) => cartaoController.registerPage(request, response));
    routes.get("/cartoes/visualizar/:id", async (request, response) => cartaoController.viewPage(request, response));
    routes.get("/cartoes/editar/:id", async (request, response) => cartaoController.editPage(request, response));
    routes.get("/cartoes/deletar/:id", async (request, response) => cartaoController.deletePage(request, response));
    
    routes.get('/api/cartoes', async (request, response) => cartaoController.listAllAPI(request, response));
    routes.get('/api/cartoes/:id', async (request, response) => cartaoController.searchIDAPI(request, response));

    routes.post('/api/cartoes', async (request, response) => cartaoController.registerAPI(request, response));
    routes.patch('/api/cartoes', async (request, response) => cartaoController.updateCartaoAPI(request, response));
    routes.delete('/api/cartoes/:id', async (request, response) => cartaoController.deleteCartaoAPI(request, response));
    
    return routes;
}