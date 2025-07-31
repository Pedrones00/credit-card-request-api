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

    async #validateInputs(request, response) {
        if (request.body.id_cartao && request.body.id_cliente) {
            return true;
        }

        response.status(400).json({error: 'Campos obrigatórios não preenchidos'});
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

        console.log(today, dt_inicio_vigencia, dt_fim_vigencia);
        console.log(cartao);
        
        if (dt_inicio_vigencia > today || dt_fim_vigencia < today) {
            return false;
        }
            
        return true;
    }

    async #validateCartaoCliente(response, id_cartao, id_cliente) {

        const isValidCartao = await this.#validateCartao(id_cartao);
        const isValidCliente = await this.#validateCliente(id_cliente);
        
        if (!isValidCartao || !isValidCliente) {
            let errors = [];

            if (!isValidCartao) errors.push('Cartao inválido');
            if (!isValidCliente) errors.push('Cliente inválido');

            response.status(400).json({error : errors});
            return false;
        }
        
        return true;

    }

    async listAll(request, response) {
        try {
            const details = request.query.details;
            const actives = request.query.actives;

            const contratos = await this.#getContracts(actives, details);

            response.status(200).json(contratos);

        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    async searchID(request, response) {
        try {
            const id = request.params.id_contrato;

            const contrato = await this.Contrato.findByPk(id, {
                include: [
                    {model: this.Cliente},
                    {model: this.Cartao},
                ]
            });

            if (!contrato) {
                return response.status(404).json({error: 'Contrato não encontrado'});
            }

            response.status(200).json(contrato);

        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    async register(request, response) {
        try {
            const isValidInput = await this.#validateInputs(request, response);
            if (!isValidInput) return;

            const isValidClienteCartao = await this.#validateCartaoCliente(response, request.body.id_cartao, request.body.id_cliente);
            if (!isValidClienteCartao) return;
            
            const newContrato = await this.Contrato.create(request.body);

            response.status(201).json(newContrato);

        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    async update(request, response) {
        try {
            const id_contrato = request.body.id_contrato;
            const id_cartao = request.body.id_cartao;
            const id_cliente = request.body.id_cliente;

            const contrato = await this.Contrato.findByPk(id_contrato);
            if (!contrato) {
                response.status(400).json({error: 'Contrato Inválido'});
                return;
            }
            
            if (id_cartao) {
                const isValidCartao = await this.#validateCartao(id_cartao);
                if (!isValidCartao) {
                    response.status(400).json({error : "Cartão inválido."});
                    return;
                }
            }

            if (id_cliente) {
                const isValidCliente = await this.#validateCliente(id_cliente);
                if (!isValidCliente) {
                    response.status(400).json({error : "Cliente inválido."});
                    return;
                }
            }
            
            await contrato.update(request.body);

            response.status(200).json({
                message: "Contrato atualizado com sucesso",
                contrato,
            });

        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    async delete(request, response) {
        try {
            const id_contrato = request.body.id_contrato;
            const contrato = await this.Contrato.findByPk(id_contrato);
            if (!contrato) {
                response.status(400).json({error: 'Contrato Inválido'});
                return;
            }
            
            const today = this.#getToday();
            const dateEndContrato = new Date(contrato.dt_fim_vigencia).toISOString();

            if (dateEndContrato <= today) {
                response.status(400).json({error : 'Contrato já está desativado.'});
                return;
            }

            await contrato.update({
                dt_fim_vigencia: today
            });

            response.status(200).json({
                message: "Contrato estará desabilidado a partir de amanhã.",
                contrato,
            })


        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }
}

export default ContratoController;