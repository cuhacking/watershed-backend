import express from 'express';

import * as user from '../controllers/userController';
import * as auth from '../middleware/authMiddleware';

const router = express.Router();

/**
 * GET /user
 * @tag Users
 * @summary Gets all users.
 * @response 200 - An array of all the users
 * @responseContent {User} 200.application/json
 */
router.get('/', auth.authenticate, user.getUsers);

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
router.delete('/:userId', user.deleteUser);

export = router;