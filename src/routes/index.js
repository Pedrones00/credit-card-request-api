import express from 'express';
import swaggerUI from 'swagger-ui-express';
import yaml from 'yamljs';
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

    const docsRoutes = () => {
        const route = express.Router();

        const clientesDocs = yaml.load('src/docs/clientesDocs.yaml');
        const cartoesDocs = yaml.load('src/docs/cartoesDocs.yaml');
        const contratosDocs = yaml.load('src/docs/contratosDocs.yaml');

        const docFiles = {
            openapi: '3.0.0',
            info: {
                title: 'credit-card-request-api',
                version: '0.0.1',
                description: 'Card, Customer, and Contract Management API',
                },
            paths: {
                ...clientesDocs.paths,
                ...cartoesDocs.paths,
                ...contratosDocs.paths,
                }
            };

        route.use("/api/docs", swaggerUI.serve, swaggerUI.setup(docFiles, {explorer: false, docExpasion: 'true'}));
        
        return route;
    }

    const routeNotFound = (request, response) => response.status(404).render("404", { titulo: "Página não encontrada" });

    app.use(indexRoute());
    app.use(docsRoutes());
    app.use(clienteRoute(clienteController));
    app.use(cartaoRoute(cartaoController));
    app.use(contratoRoute(contratoController));
    app.use(routeNotFound);
}

export default routes;