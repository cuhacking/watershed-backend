import express from 'express';
import morgan from 'morgan';
import path from 'path';

import routes from './routes/routes';
import {createConnection} from 'typeorm';

import openapi from 'openapi-comment-parser';
import swaggerUi from 'swagger-ui-express';
/**
 * Constants
 */
const PORT = 8080;
const API_ROOT = '/api';
const ENV = process.env.NODE_ENV || 'development';

const app = express();
const spec = openapi({cwd: path.join(__dirname,'../src')});

/**
 * Middleware
 */
app.use(express.json({ limit: '50mb' }));
app.use(morgan('tiny'));

app.use(API_ROOT, routes);

if(ENV === 'development') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

createConnection().then(() => {
    app.listen(PORT);
    console.log(`Server listening | PORT: ${PORT} | MODE: ${ENV}`);
});

export = app;