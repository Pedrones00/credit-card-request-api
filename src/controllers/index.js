import initModel from '../models/index.js'
import ClienteController from './clienteController.js'

const setupControllers = async () => {
        const {Cliente, Cartao, Contrato, dbconnection} = await initModel();
        const clienteController = new ClienteController(Cliente)

        return {
            clienteController,
        }
}

export default setupControllers;