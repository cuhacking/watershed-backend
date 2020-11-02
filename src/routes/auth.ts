import express from 'express';
import * as auth from '../controllers/auth';

const router = express.Router();


/**
 * POST /auth/login
 * @tag Authentication
 * @summary Logs in a user
 * @bodyContent {string} email - the user's email
 * @bodyContent {string} password - the user's password
 * @bodyRequired
 * @response 200 - Successful login
 * @responseContent {Login} 200.application/json
 * @response 401 - Invalid email or password
 */
router.post('/login', auth.login);

/**
 * POST /auth/refresh
 * @tag Authentication
 * @summary Refreshes a user's access token using their refresh token
 * @bodyContent {string} refreshToken - the user's refresh token
 * @bodyRequired
 * @response 200 - Successful refresh
 * @responseContent {Token} 200.application/json
 * @response 401 - Invalid refresh token
 */
router.post('/refresh', auth.refresh);

/**
 * POST /auth/reset
 * @tag Authentication
 * @summary Requests a password reset email for the user - not currently implemented
 * @bodyContent {string} email - the user's email
 * @bodyRequired
 * @response 200 - Always returned, whether the email exists or not.
 */
router.post('/reset', auth.resetRequest);

/**
 * POST /auth/performReset
 * @tag Authentication
 * @summary Performs the user password reset
 * @bodyContent {string} resetToken - the reset token sent in the reset email
 * @bodyRequired
 * @response 200 - Successful reset
 * @response 400 - Invalid reset token
 */
router.post('/performReset', auth.performReset);

/**
 * POST /auth/logout
 * @tag Authentication
 * @summary Logs out a user. Note that this is not strictly required - a logout could simply clear the cookies on the frontend
 * @bodyContent {string} userId - the user's uuid
 * @bodyRequired
 * @response 200 - Successful logout
 */
router.post('/logout', auth.logout);

export = router;