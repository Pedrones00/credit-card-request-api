import express from 'express';
import clienteRoute from './clienteRoutes.js';
import cartaoRoute from './cartaoRoutes.js';
import contratoRoute from './contratoRoutes.js';
import setupControllers from '../controllers/index.js';

const routes = async (app) => {
    const {clienteController, cartaoController, contratoController} = await setupControllers();

    app.use(express.json());

    app.use(clienteRoute(clienteController));
    app.use(cartaoRoute(cartaoController));
    app.use(contratoRoute(contratoController));
}

export default routes;