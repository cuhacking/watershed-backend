import express from 'express';

import * as ravensQuest from '../controllers/ravensQuestController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * POST /ravensQuest/start
 * @tag Raven's Quest
 * @summary Starts the Raven's Quest for a user
 * @bodyRequired
 * @response 200 - Success
 * @response 404 - User with that Discord ID not found
 */
router.post('/start', ravensQuest.startQuest);

/**
 * POST /ravensQuest/switchTracks
 * @tag Raven's Quest
 * @summary Switches a user's track
 * @bodyRequired
 * @response 200 - Success
 * @response 400 - User has not yet started the Raven's Quest
 * @response 404 - User with that Discord ID not found
 */
router.post('/switchTracks', ravensQuest.switchTracks);

/**
 * POST /ravensQuest/refreshQuestions
 * @tag Raven's Quest
 * @summary If a body is provided, load those as the questions and answers. Otherwise, try to load from the file set in the .env
 * @response 200 - Success
 * @response 500 - Load failed
 */
router.post('/refreshQuestions', ravensQuest.refreshQuestionsAndAnswers);

/**
 * POST /ravensQuest/submit
 * @tag Raven's Quest
 * @summary Submits an answer
 * @bodyRequired
 * @response 200 - Correct answer
 * @response 400 - User has not yet started the Raven's Quest
 * @response 400 - Incorrect answer
 * @response 404 - User with that Discord ID not found
 */
router.post('/submit', ravensQuest.submitAnswer);

/**
 * GET /ravensQuest/question
 * @tag Raven's Quest
 * @summary Gets the answer for the user's current question
 * @pathParam {string} userId - the Discord ID of the user
 * @response 200 - Success
 * @response 400 - User has not yet started the Raven's Quest
 * @response 404 - User with that Discord ID not found
 */
router.get('/question/:userId', ravensQuest.getQuestion);

/**
 * GET /ravensQuest/progress/{userId}
 * @tag Raven's Quest
 * @summary Gets the user's current progress
 * @pathParam {string} userId - the Discord ID of the user
 * @response 200 - Success
 * @response 404 - User with that Discord ID not found
 */
router.get('/progress/:userId', ravensQuest.getProgress);

/**
 * GET /ravensQuest/progress
 * @tag Raven's Quest
 * @summary Gets the current user's current progress
 * @pathParam {string} userId - the Discord ID of the user
 * @response 200 - Success
 * @response 404 - User with that Discord ID not found
 */
router.get('/progress', ravensQuest.getCurrentUserProgress);

export = router;