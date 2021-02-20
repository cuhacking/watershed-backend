/*
Special testing endpoints
*/

import express from 'express';
import { Request, Response } from 'express';

import * as challenge from '../controllers/challengeController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * POST /challenge
 * @tag Challenges
 * @summary Create an event
 * @description Creates an event. Must be done by an admin
 * @bodyContent {Event} application/json
 * @bodyRequired
 * @response 201 - Created
 */
router.post('/', auth.authenticate(Role.Organizer), challenge.createChallenge);

/**
 * GET /challenge
 * @tag Challenges
 * @summary Gets all Challenges
 * @response 200 - List of Challenges
 * @responseContent {Event} 200.application/json
 */
router.get('/', challenge.getAllChallenges);

/**
 * GET /challenge/winner
 * @tag Challenges
 * @summary Gets all Challenge winners
 * @response 200 - List of Challenge winners
 * @responseContent {Event} 200.application/json
 */
router.get('/winner', challenge.getAllWinners);

/**
 * GET /challenge/{challengeId}
 * @tag Event
 * @summary Gets a specific event
 * @response 200 - Event
 * @responseContent {Event} 200.application/json
 */
router.get('/:challengeId', challenge.getChallenge);

/**
 * DELETE /challenge/{challengeId}
 * @tag Event
 * @summary Deletes an event
 * @response 200 - Event
 * @responseContent {Event} 200.application/json
 */
router.delete('/:challengeId', auth.authenticate(Role.Organizer), challenge.deleteChallenge);

/**
 * PATCH /challenge/{challengeId}
 * @tag Event
 * @summary Modifies an event
 * @description Modifies event with challengeId in body
 * @response 200 - OK
 */
router.patch('/:challengeId', auth.authenticate(Role.Organizer), challenge.editChallenge);

/**
 * POST /challenge/winner
 * @tag Challenges
 * @summary Create an event
 * @description Creates a winner. Submission ID and Challenge ID in the body.
 * @bodyContent {Event} application/json
 * @bodyRequired
 * @response 201 - Created
 */
router.post('/winner', auth.authenticate(Role.Organizer), challenge.setWinner);

export = router;