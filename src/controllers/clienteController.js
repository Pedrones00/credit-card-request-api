import { Op } from 'sequelize';

class ClienteController {
    constructor(ClienteModel, CartaoModel, ContratoModel) {
        this.Cliente = ClienteModel;
        this.Cartao = CartaoModel;
        this.Contrato = ContratoModel;
    }

    async #validateInputs (request, response) {
        if (!request.body.nome || !request.body.cpf || !request.body.dt_nascimento) {
            response.status(400).json({error: 'Campos obrigatórios não preenchidos'});
            return false;
        }

        return true;
    }

    async #validateClienteAtivo (request, response, cliente) {
        if (cliente.cpf_regular === false && request.body.cliente_ativo === true) {
            response.status(400).json({error: 'Cliente com cpf irregular'});
            return false;
        }

        return true;
    }

    async #verifyDuplicateCPF (request, response, cliente) {
        const cpfRequest = request.body.cpf;
        let cpfInUse = null;

        if (cpfRequest && cpfRequest !== cliente.cpf) {
            cpfInUse = await this.Cliente.findOne({
                where: {cpf: cpfRequest}
            })
        }

        if (cpfInUse) {
            response.status(409).json({error: 'CPF em uso'});
            return false;
        }

        return true;
    }

    async #disableContratos(id_cliente) {
    
            let today = new Date().toISOString();
            
            const contratos_ativos = await this.Contrato.findAll({
                where: {
                    id_cliente: id_cliente,
                    dt_fim_vigencia : {[Op.gte]:today}
                }
            });
    
            for (const contrato of contratos_ativos) {
                contrato.dt_fim_vigencia = today;
                await contrato.save();
            }
    
            return contratos_ativos;
        }

    async listAll(request, response) {
        try {
            let clienteState = true;
            const cpfCliente = request.query.cpf;
            const details = request.query.details;

            if (request.query.ativo === 'false') {
                clienteState = false
            }

            const clientes = await this.Cliente.findAll({
                where: {
                    cliente_ativo: clienteState,
                    ...(cpfCliente ? {cpf: cpfCliente} : {}) 
                },
                include: details === 'true' ?
                    [{model: this.Contrato}, ] :
                    []
            });
            response.status(200).json(clientes);

        } catch (error) {
            response.status(500).json({error: error.message})
        }
    }

    async register(request, response) {
        try {
            const isValidInput = await this.#validateInputs(request, response);
            if (!isValidInput) return;

            const searchCliente = await this.Cliente.findOne({
                where: {cpf: request.body.cpf}
            });

            if (searchCliente) {
                return response.status(409).json({
                    error: 'Usuário com cpf já existente.'
                });
            }

            if (request.body.cpf_regular === false) {
                return response.status(403).json({
                    error: 'Usuário com cpf irregular, cadastro não efetuado.'
                });
            }

            const newCliente = await this.Cliente.create(request.body);
            response.status(201).json({
                message: 'Cliente cadastrado com sucesso',
                client: newCliente,
            });

        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    async searchID(request, response) {
        try {
            const id = request.params.id;
            const details = request.query.details;

            const cliente = await this.Cliente.findByPk(id, {
                include: details === 'true' ? 
                    [{model: this.Contrato},] :
                    [],
            }
            );

            if (!cliente) {
                return response.status(404).json({error: 'Cliente não encontrado'})
            }

            return response.status(200).json(cliente);

        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    async updateCliente(request, response) {
        try {
            const cliente = await this.Cliente.findByPk(request.body.id);
            if (!cliente) {
                return response.status(404).json({error: 'Cliente não encontrado'})
            }

            const isValidInput = await this.#validateInputs(request, response);
            if (!isValidInput) return;

            const isValidClienteAtivo = await this.#validateClienteAtivo(request, response, cliente);
            if (!isValidClienteAtivo) return;

            const isValidCPF = await this.#verifyDuplicateCPF(request, response, cliente);
            if (!isValidCPF) return;
            
            await cliente.update(request.body);

            response.status(200).json({
                message: "Cliente atualizado com sucesso",
                cliente,
            })

        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    async deleteCliente(request, response) {
        try {
            const cliente = await this.Cliente.findByPk(request.params.id);
            if (!cliente) {
                return response.status(404).json({error: 'Cliente não encontrado'});
            }

            await cliente.update({cliente_ativo: false});

            const contratos_desativados = await this.#disableContratos(cliente.id_cliente);

            response.status(200).json({
                message: 'Cliente e contratos atrelados desativados com sucesso',
                contratos_desativados
            });
            
        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }
}

export default ClienteController;