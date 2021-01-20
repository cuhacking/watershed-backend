import express from 'express';
import { Request, Response } from 'express';
import {Role} from '../entity/User';

import * as stats from '../controllers/statsController';
import * as authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authMiddleware.authenticate(Role.Organizer), stats.getStats);


export = router;