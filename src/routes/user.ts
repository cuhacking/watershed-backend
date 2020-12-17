import express from 'express';

import * as user from '../controllers/userController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * GET /user
 * @tag Users
 * @summary Gets all users.
 * @response 200 - An array of all the users
 * @responseContent {User} 200.application/json
 */
router.get('/', auth.authenticate(Role.Organizer), user.getUsers);

/**
 * POST /users
 * @tag Users
 * @summary Creates a new user.
 * @bodyContent {User} application/json
 * @bodyRequired
 * @response 201 - Created
 */
router.post('/', user.createUser);

/**
 * GET /user/{userId}
 * @tag Users
 * @summary Gets a user by user uuid
 * @pathParam {string} userId - the uuid of the user to get
 * @response 200 - The user
 * @responseContent {User} 200.application/json
 * @response 404 - A user with that ID was not found
 */
router.get('/:userId', user.getUser);

/**
 * DELETE /user/{userId}
 * @tag Users
 * @summary Deletes the user with the specified user ID
 * @pathParam {string} userId - the uuid of the user to get
 * @response 200 - The user was sucessfully deleted.
 */
router.delete('/:userId', auth.authenticate(Role.Organizer), user.deleteUser);

/**
 * POST /users/confirm
 * @tag Users
 * @summary Confirms a user. POST with "token": <confirm token>
 * @bodyContent {string} application/json - The user's confirm token
 * @bodyRequired
 * @response 200 - OK
 */
router.post('/confirm', user.confirmEmail);

/**
 * POST /users/resendConfirmation
 * @tag Users
 * @summary Resends a user's confirmation email. POST with user's email
 * @bodyContent {string} application/json - The user's email
 * @bodyRequired
 * @response 200 - OK
 */
router.post('/resendConfirmation', user.resendConfirmationEmail);

export = router;