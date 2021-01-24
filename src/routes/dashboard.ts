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
 * @bodyContent {Event} application/json
 * @bodyRequired
 * @response 200 - OK
 */
router.get('/', dashboard.getDashboardInfo);

router.get('/updateEndtime', auth.authenticate(Role.Organizer), dashboard.triggerUpdateTime);

export = router;