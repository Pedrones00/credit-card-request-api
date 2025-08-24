import {Model, DataTypes} from 'sequelize';

export default (sequelize) => {
    class Cartao extends Model{}

    Cartao.init(
        {
            id_cartao: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            nome: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            tipo: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            bandeira: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            anuidade: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            cartao_ativo: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            dt_inicio_vigencia: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            dt_fim_vigencia: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: null,
            }

        },
        {
            sequelize,
            modelName: 'cartao',
            tableName: 'cartao',
            timestamps: false,
            underscored: true,
        },
    )

    return Cartao;
}