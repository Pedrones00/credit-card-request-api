import express from "express";

export default function contratoRouter(contratoController) {
    const routes = express.Router();

    routes.get('/contratos', async (request, response) => contratoController.indexPage(request, response));
    routes.get('/contratos/cadastrar', async (request, response) => contratoController.registerPage(request, response));
    routes.get('/contratos/visualizar/:id', (request, response) => contratoController.viewPage(request, response));
    routes.get('/contratos/editar/:id', async (request, response) => contratoController.editPage(request, response));
    routes.get('/contrato/deletar/:id', async (request, response) => contratoController.deletePage(request, response));

    routes.get('/api/contratos', async (request, response) => contratoController.listAllAPI(request, response));
    routes.get('/api/contratos/:id', async (request, response) => contratoController.searchIDAPI(request, response));

    routes.post('/api/contratos', async (request, response) => contratoController.registerAPI(request, response));
    routes.patch('/api/contratos', async (request, response) => contratoController.updateAPI(request, response));
    routes.delete('/api/contratos/:id', async (request, response) => contratoController.deleteAPI(request, response));

    return routes;
}