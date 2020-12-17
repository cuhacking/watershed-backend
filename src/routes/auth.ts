import express from 'express';
import * as auth from '../controllers/authController';
import * as github from '../controllers/githubController';
import * as discord from '../controllers/discordController';

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
 * @summary Requests a password reset email for the user. POST with user's email.
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

/**
 * GET /auth/github
 * @tag Authentication
 * @summary Signs up or logs in a user using GitHub. Redirects them to authorize with GitHub (OAuth)
 * @response 200 - Successful log in/sign up
 * @responseContent {Login} 200.application/json
 */
router.get('/github', github.authGithub);

/**
 * GET /auth/github/link
 * @tag Authentication
 * @summary Links a GitHub account to an existing cuHacking account. Redirects them to authorize with GitHub (OAuth)
 * @response 200 - Successful link
 */
router.get('/github/link', github.linkGithub);

// Callbacks are for internal/redirect use only. Should not be manually called.
router.get('/github/callback/signin', github.githubAuthCallback);
router.get('/github/callback/link', github.githubLinkCallback);

/**
 * GET /auth/github/unlink
 * @tag Authentication
 * @summary Unlinks the currently logged in user's GitHub account.
 * @response 204 - Successful unlink
 */
router.get('/github/unlink', github.unlinkGithub);

/**
 * GET /auth/discord
 * @tag Authentication
 * @summary Signs up or logs in a user using Discord. Redirects them to authorize with Discord (OAuth)
 * @response 200 - Successful log in/sign up
 * @responseContent {Login} 200.application/json
 */
router.get('/discord', discord.authDiscord);

/**
 * GET /auth/discord/link
 * @tag Authentication
 * @summary Links a Discord account to an existing cuHacking account. Redirects them to authorize with Discord (OAuth)
 * @response 200 - Successful link
 */
router.get('/discord/link', discord.linkDiscord);

// Callbacks are for internal/redirect use only. Should not be manually called.
router.get('/discord/callback/signin', discord.discordAuthCallback);
router.get('/discord/callback/link', discord.discordLinkCallback);

/**
 * GET /auth/discord/unlink
 * @tag Authentication
 * @summary Unlinks the currently logged in user's Discord account.
 * @response 204 - Successful unlink
 */
router.get('/discord/unlink', discord.unlinkDiscord);

export = router;