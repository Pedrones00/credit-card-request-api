import initModel from '../models/index.js';
import ClienteController from './clienteController.js';
import CartaoController from './cartaoController.js';

const setupControllers = async () => {
        const {Cliente, Cartao, Contrato, dbconnection} = await initModel();
        const clienteController = new ClienteController(Cliente);
        const cartaoController = new CartaoController(Cartao);

        return {
            clienteController,
            cartaoController,
        }
}

export default setupControllers;