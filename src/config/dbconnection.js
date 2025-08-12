import 'dotenv/config';
import {Sequelize} from 'sequelize';

class DBConnection  {
    #parametersDB
    #connection
    
    constructor() {
        this.#parametersDB = {
            host: process.env.DB_HOST,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            dialect: 'mysql',
            logging: false,
        };
        this.#connection = new Sequelize(this.#parametersDB);
    }

    async connect() {
        try {
            await this.#connection.authenticate();
            console.log('Connection has been established');
        } catch (error) {
            console.log("Error in DB connection: ", error);
        }
    }

    async close() {
        await this.#connection.close()
    }

    get connection() {
        return this.#connection;
    }
}

export default DBConnection;