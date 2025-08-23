import initModel from '../models/index.js';
import ClienteController from './clienteController.js';
import CartaoController from './cartaoController.js';
import ContratoController from './contratoController.js';

const setupControllers = async () => {
        const {Cliente, Cartao, Contrato, dbconnection} = await initModel();
        const clienteController = new ClienteController(Cliente, Cartao, Contrato);
        const cartaoController = new CartaoController(Cartao, Contrato, Cliente);
        const contratoController = new ContratoController(Contrato, Cliente, Cartao);

        return {
            clienteController,
            cartaoController,
            contratoController,
        }
}

export default setupControllers;