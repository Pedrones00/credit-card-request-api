import {Model, DataTypes} from 'sequelize';

export default (sequelize) => {
    class Contrato extends Model{}

    Contrato.init(
        {
            id_contrato: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            id_cliente: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'cliente',
                    key: 'id_cliente',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            id_cartao: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'cartao',
                    key: 'id_cartao',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            contrato_ativo:  {
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
            },

        },
        {
            sequelize,
            modelName: 'contrato',
            tableName: 'contrato',
            timestamps: false,
            underscored: true,
        },
    )

    return Contrato;
}