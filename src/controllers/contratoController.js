import { Op } from 'sequelize';

class ContratoController {
    constructor(ContratoModel, ClienteModel, CartaoModel) {
        this.Contrato = ContratoModel;
        this.Cliente = ClienteModel;
        this.Cartao = CartaoModel;
        this.mutableRequestFields = { fields: ['id_cliente', 'id_cartao',]};
    }

    #getToday(){
        let today = new Date().toISOString();
        return today;
    }

    #throwError(errorStatusCode = 500, errorMessage = '') {
        const err =  new Error(errorMessage);
        err.statusCode = errorStatusCode;
        throw err;
    }

    #createSequelizeIncludeArrays (detailsCliente, detailsCartao) {
        
        let arrayInclude = [];

        if (detailsCliente) {
            arrayInclude.push({model: this.Cliente});
        }
        
        if (detailsCartao) {
            arrayInclude.push({model: this.Cartao});
        }

        return arrayInclude;
    }

    #validateRegisterInputs(request) {

        let errorMessages = [];

        if (!request.body) this.#throwError(400, 'Requisição sem corpo, é necessário o envio de informações para o cadastro de um contrato');

        if (!request.body.id_cartao) errorMessages.push('id_cartao: id do cartão a ser cadastrado');
        if (!request.body.id_cliente) errorMessages.push('id_cliente: id do cliente a ser cadastrado');

        if (errorMessages.length) this.#throwError(400, `Campos obrigatórios não preenchidos: ${errorMessages}`);
    }

    #validateUpdateInputs(request) {
        
        if (!request.body) this.#throwError(400, 'Requisição sem corpo, é necessário o envio de informações para o cadastro de um contrato');

        if (!request.body.id_contrato) this.#throwError(400, 'O ID do contrato está ausente (id_contrato)');
        if (!request.body.id_cartao && !request.body.id_cliente) this.#throwError(400, 'Sem informações para atualizar');
    }

    async #getActiveClientes(){
        const clientes = await this.Cliente.findAll({
                where: {
                    cliente_ativo: true,
                }
            });

        return clientes;
    }

    async #getActiveCartoes(){
        const today = this.#getToday();

        const cartoes = await this.Cartao.findAll({
            where: {
                cartao_ativo: true,
            }
        });

        return cartoes;
    }

    async #validateCartaoCliente(id_cartao, id_cliente) {

        let errorMessages = []

        const cartao = await this.Cartao.findByPk(id_cartao);
        const cliente = await this.Cliente.findByPk(id_cliente);
        
        if (!cartao && id_cartao) errorMessages.push('Cartao não existe');
        if (!cliente && id_cliente) errorMessages.push('Cliente não existe');
    
        if (cartao && !cartao.cartao_ativo) errorMessages.push('Cartao está desativado');
        if (cliente && !cliente.cliente_ativo) errorMessages.push('Cliente está desativado');
        if (cliente && !cliente.cpf_regular) errorMessages.push('Cliente com cpf irregular');

        if (errorMessages.length) this.#throwError(400, `Campos inválidos: ${errorMessages}`)

    }

    async #listAll(contratoState = null, detailsCliente = false, detailsCartao = false) {
        
        const contratos = await this.Contrato.findAll({
                where : contratoState  === null? {} : {contrato_ativo: contratoState},
                include: this.#createSequelizeIncludeArrays(detailsCliente, detailsCartao),
            });

        return contratos;
    }

    async #searchID(id_contrato, detailsCliente = false, detailsCartao = false) {
        const contrato = await this.Contrato.findByPk(id_contrato, {
            include: this.#createSequelizeIncludeArrays(detailsCliente, detailsCartao),
        });

        if (!contrato) this.#throwError(404, 'Contrato não encontrado');

        return contrato;
    }

    async #register(request) {

        this.#validateRegisterInputs(request);

        await this.#validateCartaoCliente(request.body.id_cartao, request.body.id_cliente);
        
        const newContrato = await this.Contrato.create(request.body, this.mutableRequestFields);

        return await newContrato.reload();
    }

    async #update(request) {

        this.#validateUpdateInputs(request);

        const id_contrato = request.body.id_contrato;
        const id_cartao = request.body.id_cartao;
        const id_cliente = request.body.id_cliente;

        const contrato = await this.Contrato.findByPk(id_contrato);
        if (!contrato) this.#throwError(404, 'Contrato não encontrado');
        if(contrato.contrato_ativo === false) this.#throwError(400, 'O contrato esta desativado, não é possível alterar seus registros');
            
        await this.#validateCartaoCliente(id_cartao, id_cliente);
            
        await contrato.update(request.body, this.mutableRequestFields);

        return contrato;
    }

    async #delete(id_contrato) {
        const contrato = await this.Contrato.findByPk(id_contrato);

        if (!contrato) this.#throwError(404, 'Contrato não encontrado');
        if (!contrato.contrato_ativo) this.#throwError(400, 'O cartão já estava desativado, nenhuma modificação foi realizada');
        
        const today = this.#getToday();
        
        await contrato.update({
            dt_fim_vigencia: today,
            contrato_ativo: false,
        });

        return contrato;
    }

    async listAllAPI(request, response) {
        try {

            const arrayQueryDetails = Array.isArray(request.query.details) ? [...request.query.details] : [request.query.details];
            let contratoState = null;
            let detailsCartao = false;
            let detailsCliente = false;

            
            if (request.query.active === 'false') contratoState = false;
            if (request.query.active === 'true') contratoState = true;

            if (arrayQueryDetails.includes('cartao')) detailsCartao = true;
            if (arrayQueryDetails.includes('cliente')) detailsCliente = true;

            const contratos = await this.#listAll(contratoState, detailsCliente, detailsCartao);

            return response.status(200).json(contratos);

        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async searchIDAPI(request, response) {
        try {
            const id_contrato = request.params.id;

            const arrayQueryDetails = Array.isArray(request.query.details) ? [...request.query.details] : [request.query.details];
            let detailsCartao = false;
            let detailsCliente = false;

            if (arrayQueryDetails.includes('cartao')) detailsCartao = true;
            if (arrayQueryDetails.includes('cliente')) detailsCliente = true;

            const contrato = await this.#searchID(id_contrato, detailsCliente, detailsCartao);

            return response.status(200).json(contrato);

        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async registerAPI(request, response) {
        try {
            
            const newContrato = await this.#register(request);

            return response.status(201).json(newContrato);

        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async updateAPI(request, response) {
        try {

            const contrato = await this.#update(request);

            return response.status(200).json({
                message: "Contrato atualizado com sucesso",
                contrato,
            });

        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async deleteAPI(request, response) {
        try {
            const id_contrato = request.params.id;

            const contrato = await this.#delete(id_contrato);

            return response.status(200).json({
                message: "O contrato está desativado.",
                contrato,
            });


        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async indexPage(request, response) {
        try {
            const contratos = await this.#listAll(null, true, true);

            return response.render("contratos/index", {
                titulo: "Contratos",
                alerta: false,
                contratos,
            });
        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }

    async registerPage(request, response) {
        try {
            const cartoes = await this.#getActiveCartoes();
            const clientes = await this.#getActiveClientes();

            response.render("contratos/create", {
                titulo: "Contratos",
                cartoes,
                clientes,
            });
        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }

    async viewPage(request, response) {
        try {
            const id = request.params.id;
            const contrato = await this.#searchID(id, true, true);
            const cartoes = await this.#getActiveCartoes();
            const clientes = await this.#getActiveClientes();

            return response.render("contratos/read", {
                titulo: "Contratos",
                contrato,
                cartoes,
                clientes,
            });

        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }

    async editPage(request, response) {
        try {
            const id = request.params.id;
            const contrato = await this.#searchID(id, true, true);
            const cartoes = await this.#getActiveCartoes();
            const clientes = await this.#getActiveClientes();

            return response.render("contratos/update", {
                titulo: "Contratos",
                contrato,
                cartoes,
                clientes,
            });

        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }

    async deletePage(request, response) {
        try {
            const id = request.params.id;
            await this.#delete(id);
            
            const contratos = await this.#listAll(null, true, true);

            return response.render("contratos/index", {
                titulo: "Contratos",
                alerta: true,
                contratos
            });
        } catch (error) {
            return response.render("500", {titulo: 'Erro!', error});
        }
    }
}

export default ContratoController;