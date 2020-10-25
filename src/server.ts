import express from 'express';
import morgan from 'morgan';

import routes from './routes/routes';
import {createConnection} from 'typeorm';

/**
 * Constants
 */
const PORT = 8080;
const API_ROOT = '/api';
const ENV = process.env.NODE_ENV || 'development';

const app = express();

/**
 * Middleware
 */
app.use(express.json({ limit: '50mb' }));
app.use(morgan('tiny'));

app.use(API_ROOT, routes)

createConnection().then(() => {
    app.listen(PORT);
    console.log(`Server listening | PORT: ${PORT} | MODE: ${ENV}`);
});

export = app;