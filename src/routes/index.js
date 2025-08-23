import express from 'express';
import clienteRoute from './clienteRoutes.js';
import cartaoRoute from './cartaoRoutes.js';
import contratoRoute from './contratoRoutes.js';
import setupControllers from '../controllers/index.js';

const routes = async (app) => {
    const {clienteController, cartaoController, contratoController} = await setupControllers();

    const indexRoute = () => {
        const route = express.Router();

        route.get("/", (request, response) => {
            response.render("index", {titulo: "Início"})
        });

        return route;
    }

    const routeNotFound = (request, response) => response.status(404).render("404", { titulo: "Página não encontrada" });

    app.use(indexRoute());
    app.use(clienteRoute(clienteController));
    app.use(cartaoRoute(cartaoController));
    app.use(contratoRoute(contratoController));
    app.use(routeNotFound);
}

export default routes;