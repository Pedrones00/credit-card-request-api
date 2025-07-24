import {Model, DataTypes} from 'sequelize';

export default (sequelize) => {
    class Cliente extends Model{}

    Cliente.init(
        {
            id_cliente: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            nome: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            cpf: {
                type: DataTypes.STRING(11),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            dt_nascimento: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            cpf_regular: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            }

        },
        {
            sequelize,
            modelName: 'cliente',
            tableName: 'cliente',
            timestamps: false,
            underscored: true,
        },
    )

    return Cliente;

}