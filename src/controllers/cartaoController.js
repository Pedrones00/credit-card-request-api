import { Op } from 'sequelize';

class CartaoController {
    constructor(CartaoModel, ContratoModel) {
        this.Cartao = CartaoModel;
        this.Contrato = ContratoModel;
    }

    async #getActiveCards() {
        let today = new Date().toISOString();

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
        let today = new Date().toISOString();

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

        let today = new Date().toISOString();
        
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

    async #validateInputs(request, response) {

        if (request.body.nome && request.body.tipo && request.body.bandeira && request.body.anuidade) {
            return true;
        }

        response.status(400).json({error: 'Campos obrigatórios não preenchidos'});
        return false;

    }

    async listAll(request, response) {
        try {
            let cartoes = null;

            if (request.query.ativo === 'false') {
                cartoes = await this.#getDeactiveCards();
            } else {
                cartoes = await this.#getActiveCards();
            }

            response.status(200).json(cartoes);

        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    async searchID(request, response) {
        try {
            const id = request.params.id;

            const cartao = await this.Cartao.findByPk(id);
            if (!cartao) {
                return response.status(404).json({error: 'Cartão não encontrado'});
            }

            response.status(200).json(cartao);

        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    async register(request, response) {
        try {
            const isValidInput = await this.#validateInputs(request, response);
            if (!isValidInput) return;

            const newCartao = await this.Cartao.create(request.body);

            response.status(200).json(newCartao);

        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    async updateCartao(request, response) {
        try {
            const cartao = await this.Cartao.findByPk(request.body.id);
            if (!cartao) {
                return response.status(404).json({error: 'Cartão não encontrado'});
            }

            await cartao.update(request.body);

            response.status(200).json({
                message: "Cartão atualizado com sucesso",
                cartao,
            });

        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    async deleteCartao(request, response) {
        try {
            let today = new Date().toISOString();

            const cartao = await this.Cartao.findByPk(request.params.id);
            if (!cartao) {
                return response.status(404).json({error: 'Cartão não encontrado'});
            }

            await cartao.update({dt_fim_vigencia: today});

            const contratos_desativados = await this.#disableContratos(cartao.id_cartao);

            response.status(200).json({
                message: "O cartão e seus contratos estarão desabilitado a partir de amanhã.",
                cartao,
                contratos_desativados
            });

        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }
}

export default CartaoController;