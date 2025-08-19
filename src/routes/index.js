import express from 'express';
import clienteRoute from './clienteRoutes.js';
import cartaoRoute from './cartaoRoutes.js';
import contratoRoute from './contratoRoutes.js';
import setupControllers from '../controllers/index.js';

const routes = async (app) => {
    const {clienteController, cartaoController, contratoController} = await setupControllers();

    const index_route = () => {
        const route = express.Router();

        route.get("/", (request, response) => {
            response.render("index", {titulo: "Início"})
        });

        return route;
    }

    app.use(index_route());
    app.use(clienteRoute(clienteController));
    app.use(cartaoRoute(cartaoController));
    app.use(contratoRoute(contratoController));
}

export default routes;