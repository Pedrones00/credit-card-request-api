import { Op } from 'sequelize';

class CartaoController {
    constructor(CartaoModel, ContratoModel) {
        this.Cartao = CartaoModel;
        this.Contrato = ContratoModel;
    }

    #getToday(){
        let today = new Date().toISOString();
        return today;
    }

    async #getActiveCards() {
        let today = this.#getToday();

        const cartoes = await this.Cartao.findAll({
            where: {
                    dt_fim_vigencia: {
                        [Op.gte]: today,
                    },
                    dt_inicio_vigencia: {
                        [Op.lte]: today
                    }
            }
        });

        return cartoes;
    }

    async #getDeactiveCards() {
        let today = this.#getToday();

        const cartoes = await this.Cartao.findAll({
            where: {
                [Op.or]:
                    [
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
        });

        return cartoes;
    }

    async #disableContratos(id_cartao) {

        let today = this.#getToday();
        
        const contratos_ativos = await this.Contrato.findAll({
            where: {
                id_cartao: id_cartao,
                dt_fim_vigencia : {[Op.gte]:today}
            }
        });

        for (const contrato of contratos_ativos) {
            contrato.dt_fim_vigencia = today;
            await contrato.save();
        }

        return contratos_ativos;
    }

    #validateInputs(request) {

        if (request.body && request.body.nome && request.body.tipo && request.body.bandeira) {
            return true;
        }

        return false;

    }

    async #listAll(request) {

        let cartoes = null;

        if (request.query.ativo === 'false') {
            cartoes = await this.#getDeactiveCards();
        } else {
            cartoes = await this.#getActiveCards();
        }

        return cartoes;

    }

    async #searchID(id) {
        const cartao = await this.Cartao.findByPk(id);

        return cartao;
    }

    async #register(request) {

            const isValidInput = this.#validateInputs(request);
            if (!isValidInput) {
                const err =  new Error("Campos obrigatórios não preenchidos!");
                err.statusCode = 400;
                throw err;
            }

            const newCartao = await this.Cartao.create(request.body);
            return newCartao;
    }

    async #updateCartao(request) {
        const id = request.body.id;
        const cartao = await this.#searchID(id);
        if (!cartao) {
            const err = new Error("Cartão não encontrado");
            err.statusCode = 404;
            throw err;
        }

        const updatedCartao = await cartao.update(request.body);
        return updatedCartao;
    }

    async #deleteCartao(id) {
        const today = this.#getToday();
        const cartao = await this.Cartao.findByPk(id);

        if (!cartao) {
            const err = new Error("Cartão não encontrado");
            err.statusCode = 404;
            throw err;
        }

        await cartao.update({dt_fim_vigencia: today});
        const contratos_desativados = await this.#disableContratos(cartao.id_cartao);

        return {cartao, contratos_desativados};
        
    }

    async listAllAPI(request, response) {
        try {
            const cartoes = await this.#listAll(request);

            return response.status(200).json(cartoes);
            
        } catch (error) {
            return response.status(500).json({error: error.message});
        }
    }

    async searchIDAPI(request, response) {
        try {
            const id = request.params.id;
            const cartao = await this.#searchID(id);

            if (!cartao) {
                return response.status(404).json({error: "Cartão não encontrado"});
            }

            return response.status(200).json(cartao);

        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    async registerAPI(request, response) {
        try {
            const newCartao = await this.#register(request);

            response.status(200).json(newCartao);
            
        } catch (error) {
            if (error.statusCode === 400) return response.status(error.statusCode).json({error: error.message});

            return response.status(500).json({ error: error.message});
        }
    }

    async updateCartaoAPI(request, response) {
        try {
            const updatedCartao = await this.#updateCartao(request);

            return response.status(200).json({
                message: "Cartão atualizado com sucesso",
                updatedCartao,
            });

        } catch (error) {
            if (error.statusCode === 404) return response.status(error.statusCode).json({error: error.message});

            return response.status(500).json({ error: error.message});
        }
    }

    async deleteCartaoAPI(request, response) {
        try {
            const id = request.params.id;

            const {cartao, contratos_desativados} = await this.#deleteCartao(id);

            response.status(200).json({
                    message: "O cartão e seus contratos estarão desabilitado a partir de amanhã.",
                    cartao,
                    contratos_desativados
                });

        } catch (error) {
            if (error.statusCode === 404) return response.status(error.statusCode).json({error: error.message});

            response.status(500).json({ error: error.message });
        }
    }

    async indexPage(request, response) {
        try {
            const cartoes = await this.#listAll(request);

            response.render("cartoes", {
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
            response.render("cadastrar_cartao", { titulo: "Cartões" });
        } catch (error) {
            response.render("500", {error});
        }
    }

    async viewPage(request, response) {
        try {
            const id = request.params.id;
            const cartao = await this.#searchID(id);

            response.render("visualizar_cartao", {
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

            response.render("editar_cartao", {
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

            const cartoes = await this.#listAll(request);

            response.render("cartoes", {
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