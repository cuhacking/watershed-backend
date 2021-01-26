import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import path from 'path';
import fileUpload from 'express-fileupload';

import routes from './routes/routes';
import {createConnection} from 'typeorm';

import openapi from 'openapi-comment-parser';
import swaggerUi from 'swagger-ui-express';

import {loadQuestionsAndAnswers} from './controllers/ravensQuestController';
import {updateStartEndTime} from './controllers/dashboardController';
/**
 * Constants
 */
const PORT = 8080;
const API_ROOT = '/api';
const ENV = process.env.NODE_ENV || 'development';
const FILE_SIZE_LIMIT = process.env.FILE_SIZE_LIMIT ? parseInt(process.env.FILE_SIZE_LIMIT) : 20 * 1024 * 1024; // Default to 20MB

if(!process.env.JWT_KEY) {
    console.log('JWT key must be set.');
    process.exit(1);
}

const app = express();
const spec = openapi({cwd: path.join(__dirname,'../src')});

/**
 * Middleware
 */
app.use(express.json({ limit: '50mb' }));
app.use(morgan('tiny'));
app.use(fileUpload({abortOnLimit: true, limits: {fileSize: FILE_SIZE_LIMIT}}));

app.use(API_ROOT, routes);

if(ENV === 'development') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

createConnection().then(async () => {
    await loadQuestionsAndAnswers();
    await updateStartEndTime();
    app.listen(PORT);
    console.log(`Server listening | PORT: ${PORT} | MODE: ${ENV}`);
});

export = app;