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
                references: {
                    model: 'cliente',
                    key: 'id_cliente',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            id_cartao: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'cartao',
                    key: 'id_cartao',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            dt_inicio_vigencia: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            dt_fim_vigencia: {
                type: DataTypes.DATEONLY,
                allowNull: false,
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