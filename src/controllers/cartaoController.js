import { Op } from 'sequelize';

class CartaoController {
    constructor(CartaoModel, ContratoModel, ClienteModel) {
        this.Cartao = CartaoModel;
        this.Contrato = ContratoModel;
        this.Cliente = ClienteModel;
        this.mutableRequestFields = { fields: ['nome', 'tipo', 'bandeira', 'anuidade', ]};
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

    #createSequelizeIncludeArrays (detailsContrato, detailsCliente) {
        
        let arrayInclude = [];

        if (detailsContrato) {
            const contratoInclude = {
                model: this.Contrato,
            };
            if (detailsCliente) contratoInclude.include = [{model: this.Cliente}];

            arrayInclude.push(contratoInclude);

        } else if (detailsCliente) {
            const contratoInclude = {
                model: this.Contrato,
                attributes: ['id_contrato']
            };
            if (detailsCliente) contratoInclude.include = [{model: this.Cliente}];
            arrayInclude.push(contratoInclude);
        }

        return arrayInclude;
    }

    #validateRegisterInputs(request) {

        let errorMessages = [];

        if (!request.body) this.#throwError(400, 'Requisição sem corpo, é necessário o envio de informações para o cadastro de um cartão');

        if (!request.body.nome) errorMessages.push('nome: nome do cartão');
        if (!request.body.tipo) errorMessages.push('tipo: tipo do cartão');
        if (!request.body.bandeira) errorMessages.push('bandeira: bandeira do cartão');

        if (errorMessages.length) this.#throwError(400, `Campos obrigatórios não preenchidos: ${errorMessages}`);
        
    }

    #validateUpdateInputs(request) {

        if (!request.body) this.#throwError(400, 'Requisição sem corpo, é necessário o envio de informações para o cadastro de um cartão');

        if (!request.body.id_cartao) this.#throwError(400, 'O ID do cartão está ausente (id_cartao)');
    }

    async #disableContratos(id_cartao) {

        let today = this.#getToday();
        
        const contratos_ativos = await this.Contrato.findAll({
            where: {
                id_cartao: id_cartao,
                contrato_ativo : true,
            }
        });

        for (const contrato of contratos_ativos) {
            contrato.contrato_ativo = false;
            contrato.dt_fim_vigencia = today;
            await contrato.save();
        }

        return contratos_ativos;
    }

    async #listAll(cartaoState = null, detailsContrato = false, detailsCliente = true) {

        const cartoes = await this.Cartao.findAll({
            where: cartaoState === null ? {} : {cartao_ativo: cartaoState},
            include: this.#createSequelizeIncludeArrays(detailsContrato, detailsCliente),
        });

        return cartoes;
    }

    async #searchID(id_cartao, detailsContrato = false, detailsCliente = true) {

        const cartao = await this.Cartao.findByPk(id_cartao, {
            include: this.#createSequelizeIncludeArrays(detailsContrato, detailsCliente),
        });

        if (!cartao) this.#throwError(404, 'Cartão não encontrado');

        return cartao;
    }

    async #register(request) {

        this.#validateRegisterInputs(request);

        const newCartao = await this.Cartao.create(request.body, this.mutableRequestFields);

        return await newCartao.reload();
    }

    async #updateCartao(request) {

        this.#validateUpdateInputs(request);

        const id_cartao = request.body.id_cartao;

        const cartao = await this.#searchID(id_cartao, false, false);
        if (!cartao) this.#throwError(404, 'Cartão não encontrado');
        if(cartao.cartao_ativo === false) this.#throwError(400, 'O cartão esta desativado, não é possível alterar seus registros');

        const updatedCartao = await cartao.update(request.body, this.mutableRequestFields);

        return updatedCartao;
    }

    async #deleteCartao(id_cartao) {
        const today = this.#getToday();
        const cartao = await this.#searchID(id_cartao, false, false);

        if (!cartao) this.#throwError(404, 'Cartão não encontrado');
        if(cartao.cartao_ativo === false) this.#throwError(400, 'O cartão já estava desativado, nenhuma modificação foi realizada');

        await cartao.update({cartao_ativo: false, dt_fim_vigencia: today});
        const contratos_desativados = await this.#disableContratos(cartao.id_cartao);

        return {cartao, contratos_desativados};
        
    }

    async listAllAPI(request, response) {
        try {
            const arrayQueryDetails = Array.isArray(request.query.details) ? [...request.query.details] : [request.query.details];
            let cartaoState = null;
            let detailsContrato = false;
            let detailsCliente = false;

            if (request.query.active === 'false') cartaoState = false;
            if (request.query.active === 'true') cartaoState = true;

            if (arrayQueryDetails.includes('contrato')) detailsContrato = true;
            if (arrayQueryDetails.includes('cliente')) detailsCliente = true;

            const cartoes = await this.#listAll(cartaoState, detailsContrato, detailsCliente);

            return response.status(200).json(cartoes);
            
        } catch (error) { 
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async searchIDAPI(request, response) {
        try {
            const id_cartao = request.params.id;
            const arrayQueryDetails = Array.isArray(request.query.details) ? [...request.query.details] : [request.query.details];
            let detailsContrato = false;
            let detailsCliente = false;

            if (arrayQueryDetails.includes('contrato')) detailsContrato = true;
            if (arrayQueryDetails.includes('cliente')) detailsCliente = true;

            const cartao = await this.#searchID(id_cartao, detailsContrato, detailsCliente);

            return response.status(200).json(cartao);

        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async registerAPI(request, response) {
        try {
            const newCartao = await this.#register(request);

            return response.status(200).json(newCartao);
            
        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async updateCartaoAPI(request, response) {
        try {
            const cartao = await this.#updateCartao(request);

            return response.status(200).json({
                message: "Cartão atualizado com sucesso",
                cartao,
            });

        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async deleteCartaoAPI(request, response) {
        try {
            const id_cartao = request.params.id;

            const {cartao, contratos_desativados} = await this.#deleteCartao(id_cartao);

            return response.status(200).json({
                    message: "O cartão e seus contratos relacionados foram desativados.",
                    cartao,
                    contratos_desativados
                });

        } catch (error) {
            return response.status(error.statusCode? error.statusCode : 500).json({error: error.message});
        }
    }

    async indexPage(request, response) {
        try {
            const cartoes = await this.#listAll(true, false, false);

            response.render("cartoes/index", {
                titulo: "Cartões",
                alerta: false,
                cartoes,
            });
        } catch (error) {
            response.render("500", {error});
        }
    }

    async registerPage(request, response) {
        try {
            response.render("cartoes/create", { titulo: "Cartões" });
        } catch (error) {
            response.render("500", {error});
        }
    }

    async viewPage(request, response) {
        try {
            const id = request.params.id;
            const cartao = await this.#searchID(id, false, false);

            response.render("cartoes/read", {
                titulo: "Cartões",
                cartao,
            });
        } catch (error) {
            response.render("500", {error});
        }
    }

    async editPage(request, response) {
        try {
            const id = request.params.id
            const cartao = await this.#searchID(id);

            response.render("cartoes/update", {
                titulo: "Cartões",
                cartao,
            });
        } catch (error) {
            response.render("500", {error});
        }
    }

    async deletePage(request, response) {
        try {
            const id = request.params.id;

            const {cartao, contratos_desativados} = await this.#deleteCartao(id);

            const cartoes = await this.#listAll(true, false, false);

            response.render("cartoes/index", {
                titulo: "Cartões",
                alerta: true,
                cartoes,
            });
        } catch (error) {
            response.render("500", {error});
        }
    }

}

export default CartaoController;