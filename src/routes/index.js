import express from 'express';
import clienteRoute from './clienteRoutes.js';
import cartaoRoute from './cartaoRoutes.js';
import setupControllers from '../controllers/index.js';

const routes = async (app) => {
    const {clienteController, cartaoController} = await setupControllers();

    app.use(express.json());

    app.use(clienteRoute(clienteController));
    app.use(cartaoRoute(cartaoController));
}

export default routes;