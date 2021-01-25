import express from 'express';

import * as dashboard from '../controllers/dashboardController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * GET /dashboard
 * @tag Dashboard
 * @summary Get dashboard info
 * @description Gets user, team, schedule, end time info
 * @response 200 - OK
 */
router.get('/', dashboard.getDashboardInfo);

/**
 * GET /updateEndtime
 * @tag Dashboard
 * @summary Get start/end time
 * @description Updates start and end time from config.json
 * @response 200 - OK
 */
router.get('/updateStartEndtime', auth.authenticate(Role.Organizer), dashboard.triggerUpdateTime);

export = router;