/*
Special testing endpoints
*/

import express from 'express';
import { Request, Response } from 'express';

import * as prize from '../controllers/prizeController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * POST /prize
 * @tag Prizes
 * @summary Create an event
 * @description Creates an event. Must be done by an admin
 * @bodyContent {Event} application/json
 * @bodyRequired
 * @response 201 - Created
 */
router.post('/', auth.authenticate(Role.Organizer), prize.createPrize);

/**
 * GET /prize
 * @tag Prizes
 * @summary Gets all Prizes
 * @response 200 - List of Prizes
 * @responseContent {Event} 200.application/json
 */
router.get('/', prize.getAllPrizes);

/**
 * GET /prize/{prizeId}
 * @tag Event
 * @summary Gets a specific event
 * @response 200 - Event
 * @responseContent {Event} 200.application/json
 */
router.get('/:prizeId', prize.getPrize);

/**
 * DELETE /prize/{prizeId}
 * @tag Event
 * @summary Deletes an event
 * @response 200 - Event
 * @responseContent {Event} 200.application/json
 */
router.delete('/:prizeId', auth.authenticate(Role.Organizer), prize.deletePrize);

/**
 * PATCH /prize/{prizeId}
 * @tag Event
 * @summary Modifies an event
 * @description Modifies event with prizeId in body
 * @response 200 - OK
 */
router.patch('/:prizeId', auth.authenticate(Role.Organizer), prize.editPrize);

export = router;