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
            },
            dt_inicio_vigencia: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: () => {
                    let today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return today;
                }
            },
            dt_fim_vigencia: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: '9999-12-31',
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