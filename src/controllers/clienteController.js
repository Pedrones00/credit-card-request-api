import { Op } from 'sequelize';

class ClienteController {
    constructor(ClienteModel, CartaoModel, ContratoModel) {
        this.Cliente = ClienteModel;
        this.Cartao = CartaoModel;
        this.Contrato = ContratoModel;
        this.mutableRequestFields = { fields: ['nome', 'cpf', 'email', 'dt_nascimento', 'cpf_regular']};
    }

    #getToday() {
        const today = new Date().toISOString();

        return today;
    }

    #throwError(errorStatusCode = 500, errorMessage = '') {
        const err = new Error(errorMessage);
        err.statusCode = errorStatusCode;
        throw err;
    }

    #validateRegisterInputs (request) {

        let errorMessages = [];

        if (!request.body) this.#throwError(400, 'Requisição sem corpo, é necessário o envio de informações para o cadastro de um cliente');

        if (!request.body.nome) errorMessages.push('nome: nome do cliente');
        if (!request.body.cpf) errorMessages.push('cpf: cpf do cliente');
        if (!request.body.dt_nascimento) errorMessages.push('dt_nascimento: data de nascimento do cliente');

        if (errorMessages.length) this.#throwError(400, `Campos obrigatórios não preenchidos: ${errorMessages}`);
    }

    #validateUpdateInputs(request) {

        if (!request.body) this.#throwError(400, 'Requisição sem corpo, é necessário o envio de informações para o cadastro de um cliente');

        if (!request.body.id_cliente) this.#throwError(400, 'O ID do cliente está ausente (id_cliente)');
    }

    #createSequelizeIncludeArrays (detailsContrato, detailsCartao) {
        
        let arrayInclude = [];

        if (detailsContrato) {
            const contratoInclude = {
                model: this.Contrato,
            };
            if (detailsCartao) contratoInclude.include = [{model: this.Cartao}];

            arrayInclude.push(contratoInclude);

        } else if (detailsCartao) {
            const contratoInclude = {
                model: this.Contrato,
                attributes: ['id_contrato']
            };
            if (detailsCartao) contratoInclude.include = [{model: this.Cartao}];
            arrayInclude.push(contratoInclude);
        }

        return arrayInclude;
    }

    async #validateDuplicateCPF (cpf_cliente) {
        
        const cpfInUse = await this.Cliente.findOne({
                where: {cpf: cpf_cliente}
            });

        if (cpfInUse) this.#throwError(409, `CPF já existe na base para o cliente id ${cpfInUse.id_cliente}`);
    }

    async #disableContratos(id_cliente) {
    
            let today = this.#getToday();
            
            const contratos_ativos = await this.Contrato.findAll({
                where: {
                    id_cliente: id_cliente,
                    contrato_ativo : true
                }
            });
    
            for (const contrato of contratos_ativos) {
                contrato.dt_fim_vigencia = today;
                contrato.contrato_ativo = false;
                await contrato.save();
            }
    
            return contratos_ativos;
        }

    async #listAll(clienteState = null, cpfCliente = null, detailsContrato = false, detailsCartao = false) {

        const clientes = await this.Cliente.findAll({
                where: {
                    ...(clienteState === null ? {} : {cliente_ativo: clienteState}),
                    ...(cpfCliente ? {cpf: cpfCliente} : {}),
                },
                include: this.#createSequelizeIncludeArrays(detailsContrato, detailsCartao),
            });

        return clientes;
    }

    async #register(request) {

        this.#validateRegisterInputs(request);
    
        await this.#validateDuplicateCPF(request.body.cpf);
        
        const newCliente = await this.Cliente.create(request.body, this.mutableRequestFields);

        return await newCliente.reload();

    }

    async #searchID(id_cliente, detailsContrato = false, detailsCartao = false) {

        const cliente = await this.Cliente.findByPk(id_cliente, {
                include: this.#createSequelizeIncludeArrays(detailsContrato, detailsCartao),
            }
            );

        if (!cliente) this.#throwError(404, 'Cliente não encontrado');

        return cliente;
    }

    async #updateCliente(request) {

        this.#validateUpdateInputs(request);

        const cliente = await this.Cliente.findByPk(request.body.id_cliente);
        if (!cliente) this.#throwError(404, 'Cliente não encontrado');

        if (request.body.cpf && request.body.cpf !== cliente.cpf) await this.#validateDuplicateCPF(request.body.cpf);
            
        await cliente.update(request.body, this.mutableRequestFields);

        return cliente;
    }

    async #deleteCliente(id_cliente) {

        const cliente = await this.Cliente.findByPk(id_cliente);
        if (!cliente) this.#throwError(404, 'Cliente não encontrado');
        if (cliente.cliente_ativo === false) this.#throwError(400, 'O cliente já está desativado, nenhum modificação foi realizada');

        await cliente.update({cliente_ativo: false});

        const contratos_desativados = await this.#disableContratos(cliente.id_cliente);

        return {cliente, contratos_desativados};
    }

    async #activateCliente(id_cliente) {
        
        const cliente = await this.Cliente.findByPk(id_cliente);

        if (!cliente) this.#throwError(404, 'Cliente não encontrado');
        if (cliente.cliente_ativo === true) this.#throwError(400, 'O cliente já está ativo, nenhum modificação foi realizada');

        await cliente.update({cliente_ativo: true});

        return cliente;
    }

    async listAllAPI(request, response) {
        try {
            const cpfCliente = request.query.cpf;
            const arrayQueryDetails = Array.isArray(request.query.details) ? [...request.query.details] : [request.query.details];
            let clienteState = null;
            let detailsContrato = false;
            let detailsCartao = false;

            if (request.query.active === 'false') clienteState = false;
            if (request.query.active === 'true') clienteState = true;

            if (arrayQueryDetails.includes('contrato')) detailsContrato = true;
            if (arrayQueryDetails.includes('cartao')) detailsCartao = true;

            const clientes = await this.#listAll(clienteState, cpfCliente, detailsContrato, detailsCartao);

            return response.status(200).json(clientes);

        } catch (error) {
            return response.status(error.statusCode ? error.statusCode : 500).json({error: error.message});
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
            return response.status(error.statusCode ? error.statusCode : 500).json({error: error.message});
        }
    }

    async searchIDAPI(request, response) {
        try {
            const id_cliente = request.params.id;
            const arrayQueryDetails = Array.isArray(request.query.details) ? [...request.query.details] : [request.query.details];
            let detailsContrato = false;
            let detailsCartao = false;

            if (arrayQueryDetails.includes('contrato')) detailsContrato = true;
            if (arrayQueryDetails.includes('cartao')) detailsCartao = true;

            const cliente = await this.#searchID(id_cliente, detailsContrato, detailsCartao);

            return response.status(200).json(cliente);

        } catch (error) {
            return response.status(error.statusCode ? error.statusCode : 500).json({error: error.message});
        }
    }

    async updateClienteAPI(request, response) {
        try {
            
            const cliente = await this.#updateCliente(request);

            return response.status(200).json({
                message: "Cliente atualizado com sucesso",
                cliente,
            });

        } catch (error) {
            return response.status(error.statusCode ? error.statusCode : 500).json({error: error.message});
        }
    }

    async deleteClienteAPI(request, response) {
        try {
            const id_cliente = request.params.id;

            const {cliente, contratos_desativados} = await this.#deleteCliente(id_cliente);

            return response.status(200).json({
                message: 'Cliente e contratos atrelados desativados com sucesso',
                cliente,
                contratos_desativados
            });
            
        } catch (error) {
            return response.status(error.statusCode ? error.statusCode : 500).json({error: error.message});
        }
    }

    async activateClienteAPI(request, response) {
        try {
            const id_cliente = request.params.id;

            const cliente = await this.#activateCliente(id_cliente);

            return response.status(200).json({
                message: 'O cliente foi ativado com sucesso',
                cliente
            });

        } catch (error) {
            return response.status(error.statusCode ? error.statusCode : 500).json({error: error.message});
        }
    }

    async indexPage(request, response) {
        try {
            const clientes = await this.#listAll(null, null, false, false);

            return response.render("clientes/index", {
                titulo: "Clientes",
                alerta: false,
                clientes,
            });

        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
        
    }

    async registerPage(request, response) {
        try {
            return response.render("clientes/create", { titulo: "Clientes" });
        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }

    async viewPage(request, response) {
        try {
            const id = request.params.id;
            const cliente = await this.#searchID(id, false, false);

            return response.render("clientes/read", {
                titulo: "Clientes",
                cliente,
                });
        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }

    async editPage(request, response) {
        try {
            const id = request.params.id;
            const cliente = await this.#searchID(id, false, false);

            return response.render("clientes/update", {
                titulo: "Clientes",
                cliente,
            });
        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }

    async deletePage(request, response) {
        try {
            const id = request.params.id;
            const {cliente, contratos_ativos} = await this.#deleteCliente(id);
            
            const clientes = await this.#listAll(null, null, false, false);

            return response.render("clientes/index", {
                titulo: "Clientes",
                alerta: true,
                clientes,
            });
        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }
}

export default ClienteController;