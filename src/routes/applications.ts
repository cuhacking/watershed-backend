import express from 'express';
import * as application from '../controllers/applicationController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * POST /application
 * @tag Applications
 * @summary Save an application
 * @description Saves an application. Field validation to be done by front end. Pass in completed = true to "submit" an application
 * @bodyContent {Application} application/json
 * @bodyRequired
 * @response 200 - Created
 */
router.post('/', application.saveApplication);

/**
 * GET /application
 * @tag Applications
 * @summary Get all applications
 * @description Returns all applications. Must be logged in as an organizer
 * @response 200 - An array of all applications
 * @responseContent {Application[]} 200.application/json
 */
router.get('/', auth.authenticate(Role.Organizer), application.getAllApplications);

/**
 * GET /application/my
 * @tag Applications
 * @summary Get the current user's application
 * @description Returns the current user's (i.e. logged in user's) application
 * @response 200 - The current user's application
 * @responseContent {Application} 200.application/json
 */
router.get('/my', application.getApplicationForUser);

/**
 * GET /application/{userId}
 * @tag Applications
 * @pathParam {string} userId - UUID of the user
 * @summary Get the specified user's application 
 * @response 200 - The specified user's application
 * @responseContent {Application} 200.application/json
 */
router.get(':userId', auth.authenticate(Role.Organizer), application.getApplicationByUserId);

export = router;