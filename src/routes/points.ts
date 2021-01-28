/*
Special testing endpoints
*/

import express from 'express';
import { Request, Response } from 'express';

import * as points from '../controllers/pointsController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * POST /points
 * @tag Points
 * @summary Creates a random code with a points value. Post a numeric value "value"
 * @bodyContent {Event} application/json
 * @bodyRequired
 * @response 201 - Created
 */
router.post('/', auth.authenticate(Role.Organizer), points.generateCode);

/**
 * GET /points
 * @tag Points
 * @summary Gets all codes and their values. Requires admin
 * @response 200 - List of Points
 * @responseContent {Event} 200.application/json
 */
router.get('/', auth.authenticate(Role.Organizer), points.getCodes);

/**
 * POST /points/redeem
 * @tag Points
 * @summary Redeems a code. Post with the code as "code"
 * @response 200 - OK
 * @responseContent {Event} 200.application/json
 */
router.post('/redeem', points.redeemCode);

export = router;