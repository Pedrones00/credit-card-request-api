import { Op } from 'sequelize';

class ClienteController {
    constructor(ClienteModel, CartaoModel, ContratoModel) {
        this.Cliente = ClienteModel;
        this.Cartao = CartaoModel;
        this.Contrato = ContratoModel;
    }

    #getToday() {
        const today = new Date().toISOString();

        return today;
    }

    #validateInputs (request) {
        if (request.body && request.body.nome && request.body.cpf && request.body.dt_nascimento) {
            return true;
        }
        return false;
    }

    #validateClienteAtivo (request, cliente) {
        if (cliente.cpf_regular === false && request.body.cliente_ativo === true) {
            return false;
        }
        return true;
    }

    async #verifyDuplicateCPF (request, cliente) {
        const cpfRequest = request.body.cpf;
        let cpfInUse = null;

        if (cpfRequest && cliente && cpfRequest !== cliente.cpf) {
            cpfInUse = await this.Cliente.findOne({
                where: {cpf: cpfRequest}
            })
        }

        if (cpfInUse) return false;

        return true;
    }

    async #disableContratos(id_cliente) {
    
            let today = this.#getToday();
            
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

    async #listAll(clienteState = true, cpfCliente = null, details = true) {

        const clientes = await this.Cliente.findAll({
                where: {
                    cliente_ativo: clienteState,
                    ...(cpfCliente ? {cpf: cpfCliente} : {}) 
                },
                include: details === true ? 
                    [{
                        model: this.Contrato,
                        include: [{model: this.Cartao}]
                    }] :
                    [],
            });

        if (!clientes && cpfCliente) {
            const err = new Error("Cliente não encontrado");
            err.statusCode = 404;
            throw err;
        }

        return clientes;
    }

    async #register(request) {

        const isValidInput = this.#validateInputs(request);
        if (!isValidInput) {
                const err =  new Error("Campos obrigatórios não preenchidos!");
                err.statusCode = 400;
                throw err;
        }

        const checkExistingCliente = await this.Cliente.findOne({
            where: {cpf: request.body.cpf}
        });

        if (checkExistingCliente) {
            const err =  new Error("Cpf já existe na base.");
            err.statusCode = 409;
            throw err;
        }

        if (request.body.cpf_regular === false) {
            const err =  new Error("Usuário com cpf irregular, cadastro não efetuado.");
            err.statusCode = 403;
            throw err;
        }
        
        const newCliente = await this.Cliente.create(request.body);

        return newCliente;

    }

    async #searchID(id, details = true) {

        const cliente = await this.Cliente.findByPk(id, {
                include: details === true ? 
                    [{
                        model: this.Contrato,
                        include: [{model: this.Cartao}]
                    }] :
                    [],
            }
            );

        if (!cliente) {
            const err = new Error("Cliente não encontrado");
            err.statusCode = 404;
            throw err;
        }

        return cliente;
    }

    async #updateCliente(request) {

        const id = request.body.id_cliente;

        const cliente = await this.Cliente.findByPk(id);
        if (!cliente) {
            const err = new Error("Cliente não encontrado");
            err.statusCode = 404;
            throw err;
        }

        const isValidClienteAtivo = this.#validateClienteAtivo(request, cliente);
        if (!isValidClienteAtivo) {
            const err =  new Error("Cliente com o cpf irregular.");
            err.statusCode = 400;
            throw err;
        }

        const isValidCPF = await this.#verifyDuplicateCPF(request, cliente);
        if (!isValidCPF) {
            const err =  new Error("CPF em uso.");
            err.statusCode = 409;
            throw err;
        }
            
        await cliente.update(request.body);

        return cliente;
    }

    async #deleteCliente(id) {

        const cliente = await this.Cliente.findByPk(id);
        if (!cliente) {
            const err = new Error("Cliente não encontrado");
            err.statusCode = 404;
            throw err;
        }

        await cliente.update({cliente_ativo: false});

        const contratos_desativados = await this.#disableContratos(cliente.id_cliente);

        return {cliente, contratos_desativados};
    }

    async listAllAPI(request, response) {
        try {
            const cpfCliente = request.query.cpf;
            let details = true;
            let clienteState = true;

            if (request.query.ativo === 'false') clienteState = false;
            if (request.query.details === 'false') details = false;

            const clientes = await this.#listAll(clienteState, cpfCliente, details);

            response.status(200).json(clientes);

        } catch (error) {
            if (error.statusCode === 404) return response.status(error.statusCode).json({error: error.message});

            return response.status(500).json({ error: error.message});
        }
    }

    async registerAPI(request, response) {
        try {
            
            const newCliente = await this.#register(request);

            return response.status(201).json({
                message: 'Cliente cadastrado com sucesso',
                cliente: newCliente,
            });

        } catch (error) {
            if (error.statusCode === 403) return response.status(error.statusCode).json({error: error.message});
            if (error.statusCode === 409) return response.status(error.statusCode).json({error: error.message});

            return response.status(500).json({ error: error.message});
        }
    }

    async searchIDAPI(request, response) {
        try {
            const id = request.params.id;
            let details = true;

            if (request.query.details === 'false') details = false;

            const cliente = await this.#searchID(id, details);

            return response.status(200).json(cliente);

        } catch (error) {
            if (error.statusCode === 404) return response.status(error.statusCode).json({error: error.message});

            return response.status(500).json({ error: error.message});
        }
    }

    async updateClienteAPI(request, response) {
        try {
            
            const updatedCliente = await this.#updateCliente(request);

            response.status(200).json({
                message: "Cliente atualizado com sucesso",
                updatedCliente,
            });

        } catch (error) {
            if (error.statusCode === 400) return response.status(error.statusCode).json({error: error.message});
            if (error.statusCode === 404) return response.status(error.statusCode).json({error: error.message});
            if (error.statusCode === 409) return response.status(error.statusCode).json({error: error.message});

            return response.status(500).json({ error: error.message});
        }
    }

    async deleteClienteAPI(request, response) {
        try {
            const id = request.params.id;

            const {cliente, contratos_desativados} = await this.#deleteCliente(id);

            response.status(200).json({
                message: 'Cliente e contratos atrelados desativados com sucesso',
                cliente,
                contratos_desativados
            });
            
        } catch (error) {
            if (error.statusCode === 404) return response.status(error.statusCode).json({error: error.message});

            response.status(500).json({error: error.message});
        }
    }

    async indexPage(request, response) {
        try {
            const activatedClientes = await this.#listAll(true, null, false);
            const deactivatedClientes = await this.#listAll(false, null, false);

            const clientes = [...activatedClientes, ...deactivatedClientes];

            response.render("clientes/index", {
                titulo: "Clientes",
                alerta: false,
                clientes,
            });

        } catch (error) {
            response.render("500", {error});
        }
        
    }

    async registerPage(request, response) {
        try {
            response.render("clientes/create", { titulo: "Clientes" });
        } catch (error) {
            response.render("500", {error});
        }
    }

    async viewPage(request, response) {
        try {
            const id = request.params.id;
            const cliente = await this.#searchID(id);

            response.render("clientes/read", {
                titulo: "Clientes",
                cliente,
                });
        } catch (error) {
            if (error.statusCode === 404) return response.render("404", {error});
            response.render("500", {error});
        }
    }

    async editPage(request, response) {
        try {
            const id = request.params.id;
            const cliente = await this.#searchID(id);

            response.render("clientes/update", {
                titulo: "Clientes",
                cliente,
            });
        } catch (error) {
            if (error.statusCode === 404) return response.render("404", {error});
            response.render("500", {error});
        }
    }

    async deletePage(request, response) {
        try {
            const id = request.params.id;
            const {cliente, contratos_ativos} = await this.#deleteCliente(id);
            
            const activatedClientes = await this.#listAll(true, null, false);
            const deactivatedClientes = await this.#listAll(false, null, false);

            const clientes = [...activatedClientes, ...deactivatedClientes];

            response.render("clientes/index", {
                titulo: "Clientes",
                alerta: true,
                clientes,
            });
        } catch (error) {
            if (error.statusCode === 404) return response.render("404", {error});
            response.render("500", {error});
        }
    }
}

export default ClienteController;