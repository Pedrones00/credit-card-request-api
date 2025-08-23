import { Op } from 'sequelize';

class ContratoController {
    constructor(ContratoModel, ClienteModel, CartaoModel) {
        this.Contrato = ContratoModel;
        this.Cliente = ClienteModel;
        this.Cartao = CartaoModel;
    }

    #getToday(){
        let today = new Date().toISOString();
        return today;
    }

    #getActiveContratosFilter() {
        const today = this.#getToday();

        const filter = {
            dt_fim_vigencia: {
                        [Op.gte]: today,
                    },
                    dt_inicio_vigencia: {
                        [Op.lte]: today
                    }
        }

        return filter;
    }

    #getDeactiveContratosFilter() {
        const today = this.#getToday();

        const filter = {
            [Op.or]: [
                        {
                            dt_fim_vigencia: {
                                [Op.lt]: today,
                            }
                        },
                        {
                            dt_inicio_vigencia: {
                                [Op.gt]: today
                            }
                        }
                    ]
        }

        return filter;
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

    #validateInputs(request) {

        if (request.body && request.body.id_cartao && request.body.id_cliente) {
            return true;
        }

        return false;
    }

    async #getContracts(actives = 'true', details = 'true') {

        const today = this.#getToday();
        
        const contratos = await this.Contrato.findAll({
                where : actives === 'true' ?
                    {
                        dt_inicio_vigencia: { [Op.lte] : today},
                        dt_fim_vigencia: {[Op.gte] : today}
                    } :
                    {}
                ,
                include: details === 'true' ? 
                    [{model: this.Cliente},
                    {model: this.Cartao},] :
                    [], 
                });

        return contratos;
    }

    async #validateCliente (id_cliente) {
        
        const cliente = await this.Cliente.findByPk(id_cliente);

        if (!cliente || !cliente.cliente_ativo) {
            return false;
        }

        return true;

    }

    async #validateCartao (id_cartao) {
                
        const cartao = await this.Cartao.findByPk(id_cartao);
        if (!cartao) {
            return false;
        }

        const today = this.#getToday();
        const dt_inicio_vigencia = new Date(cartao.dt_inicio_vigencia).toISOString();
        const dt_fim_vigencia = new Date(cartao.dt_fim_vigencia).toISOString();
        
        if (dt_inicio_vigencia > today || dt_fim_vigencia < today) {
            return false;
        }
            
        return true;
    }

    async #validateCartaoCliente(id_cartao, id_cliente) {

        const isValidCartao = await this.#validateCartao(id_cartao);
        const isValidCliente = await this.#validateCliente(id_cliente);
        
        if (!isValidCartao || !isValidCliente) {
            let errorsMessage = [];

            if (!isValidCartao) errorsMessage.push('Cartao inválido');
            if (!isValidCliente) errorsMessage.push('Cliente inválido');

            const err =  new Error(errorsMessage);
            err.statusCode = 400;
            throw err;
        }
    }

    async #listAll(contratoState = true, detailsCliente = false, detailsCartao = false) {
        
        const contratos = await this.Contrato.findAll({
                where : contratoState === true ? this.#getActiveContratosFilter() : this.#getDeactiveContratosFilter(),
                include: this.#createSequelizeIncludeArrays(detailsCliente, detailsCartao),
            });

        return contratos;
    }

    async #searchID(id, detailsCliente = false, detailsCartao = false) {
        const contrato = await this.Contrato.findByPk(id, {
            include: this.#createSequelizeIncludeArrays(detailsCliente, detailsCartao),
        });

        if (!contrato) {
            const err = new Error("Contrato não encontrado");
            err.statusCode = 404;
            throw err;
        }

        return contrato;
    }

    async #register(request) {
        const isValidInput = this.#validateInputs(request);
        if (!isValidInput) {
            const err =  new Error("Campos obrigatórios não preenchidos!");
            err.statusCode = 400;
            throw err;
        }

        await this.#validateCartaoCliente(request.body.id_cartao, request.body.id_cliente);
        
        const newContrato = await this.Contrato.create(request.body);

        return newContrato;
    }

    async #update(request) {

        const id_contrato = request.body.id_contrato;
        const id_cartao = request.body.id_cartao;
        const id_cliente = request.body.id_cliente;

        const contrato = await this.Contrato.findByPk(id_contrato);
        if (!contrato) {
            const err = new Error("Contrato não encontrado.");
            err.statusCode = 404;
            throw err;
        }
            
        if (id_cartao) {
            const isValidCartao = await this.#validateCartao(id_cartao);
            if (!isValidCartao) {
                const err = new Error("Cartão inválido.");
                err.statusCode = 400;
                throw err;
            }
        }

        if (id_cliente) {
            const isValidCliente = await this.#validateCliente(id_cliente);
            if (!isValidCliente) {
                const err = new Error("Cliente inválido.");
                err.statusCode = 400;
                throw err;
            }
        }
            
        await contrato.update(request.body);

        return contrato;
    }

    async #delete(id_contrato) {
        const contrato = await this.Contrato.findByPk(id_contrato);
        if (!contrato) {
            const err = new Error("Contrato não encontrado.");
            err.statusCode = 404;
            throw err;
        }
        
        const today = this.#getToday();
        const dateEndContrato = new Date(contrato.dt_fim_vigencia).toISOString();

        if (dateEndContrato <= today) {
            const err = new Error("Contrato já está desativado.");
            err.statusCode = 400;
            throw err;
        }

        await contrato.update({
            dt_fim_vigencia: today
        });

        return contrato;
    }

    async listAllAPI(request, response) {
        try {

            const arrayQueryDetails = Array.isArray(request.query.details) ? [...request.query.details] : [request.query.details];
            let contratoState = true;
            let detailsCartao = false;
            let detailsCliente = false;

            if (request.query.active === 'false') contratoState = false;
            if (arrayQueryDetails.includes('cartao')) detailsCartao = true;
            if (arrayQueryDetails.includes('cliente')) detailsCliente = true;

            const contratos = await this.#listAll(contratoState, detailsCliente, detailsCartao);

            response.status(200).json(contratos);

        } catch (error) {
            response.status(500).json({error: error.message});
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

            response.status(200).json(contrato);

        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    async registerAPI(request, response) {
        try {
            
            const newContrato = await this.#register(request);

            response.status(201).json(newContrato);

        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    async updateAPI(request, response) {
        try {

            const contrato = await this.#update(request);

            response.status(200).json({
                message: "Contrato atualizado com sucesso",
                contrato,
            });

        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    async deleteAPI(request, response) {
        try {
            const id_contrato = request.params.id;

            const contrato = await this.#delete(id_contrato);

            response.status(200).json({
                message: "Contrato estará desabilidado a partir de amanhã.",
                contrato,
            });


        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }
}

export default ContratoController;