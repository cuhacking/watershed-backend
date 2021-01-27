/*
Special testing endpoints
*/

import express from 'express';
import { Request, Response } from 'express';

import * as image from '../controllers/imageController';

const router = express.Router();

router.get('/:image', image.serveImage);

export = router;