import ClienteModel from "./cliente.js";
import CartaoModel from "./cartao.js";
import ContratoModel from "./contrato.js";
import DBConnection from "../config/dbconnection.js"

export default async function () {

    const dbconnection = new DBConnection();
    await dbconnection.connect();

    const Cliente = ClienteModel(dbconnection.connection);
    const Cartao = CartaoModel(dbconnection.connection);
    const Contrato = ContratoModel(dbconnection.connection);

    Cliente.hasMany(Contrato, {foreignKey: 'id_cliente'});
    Contrato.belongsTo(Cliente, {foreignKey: 'id_cliente'});

    Cartao.hasMany(Contrato, {foreignKey: 'id_cartao'});
    Contrato.belongsTo(Cartao, {foreignKey: 'id_cartao'});

    await dbconnection.connection.sync({alter: true});

    return {
        Cliente,
        Cartao,
        Contrato,
        dbconnection,
    }
}