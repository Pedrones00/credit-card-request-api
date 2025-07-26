import express from 'express';
import clienteRoute from './clienteRoutes.js';
import setupControllers from '../controllers/index.js'

const routes = async (app) => {
    const {clienteController} = await setupControllers();

    app.use(express.json())

    app.use(clienteRoute(clienteController));
}

export default routes;