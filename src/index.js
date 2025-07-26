import express from 'express';
import routes from './routes/index.js';
import "dotenv/config";

const app = express();
routes(app);

app.listen(process.env.PORT, () => {
    console.log(`Server running in http://localhost:${process.env.PORT}`);
})