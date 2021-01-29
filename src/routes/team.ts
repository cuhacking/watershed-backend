import express from 'express';

import * as team from '../controllers/teamController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * GET /team
 * @tag Teams
 * @summary Get all teams
 * @description Gets all teams
 * @response 200 - Created
 */
router.get('/', team.getTeams);

/**
 * POST /team
 * @tag Teams
 * @summary Create a new team
 * @description Creates a new team. Automatically adds creator (logged in user) to the team.
 * @response 200 - Team ID returned in response
 */
router.post('/', team.createTeam);

/**
 * GET /team/my
 * @tag Teams
 * @summary Get current user's team
 * @description Get the currently logged in user's team
 * @response 200 - OK
 */
router.get('/my', team.getMyTeam);

/**
 * GET /team/invites
 * @tag Teams
 * @summary Get current user's invites
 * @description Get the currently logged in user's invites
 * @response 200 - OK
 */
router.get('/invites', team.getInvitesForUser);

/**
 * GET /team/invites/{teamId}
 * @tag Teams
 * @summary Get a team's active invites
 * @description Get a team's active invites
 * @response 200 - OK
 */
router.get('/invites/:teamId', team.getInvitesForTeam);

/**
 * GET /team/leave
 * @tag Teams
 * @summary Current user leaves team
 * @description Remove the currently logged in user from their team, if they are in one
 * @response 200 - OK
 */
router.get('/leave', team.leaveTeam);

/**
 * POST /team/createInvite
 * @tag Teams
 * @summary Create a new team invite
 * @description Creates a team invite for the currently logged in user's team
 * @response 200 - OK
 */
router.post('/createInvite', team.createInvite);

/**
 * DELETE /team/invites/{inviteId}
 * @tag Teams
 * @summary Revoke a team invite
 * @description Revokes the invite with the provided id
 * @response 200 - OK
 */
router.delete('/invites/:inviteId', team.revokeInvite);

/**
 * GET /team/{teamId}
 * @tag Teams
 * @summary Gets a specific team
 * @description Gets a specific team
 * @response 200 - OK
 */
router.get('/:teamId', team.getTeam);

/**
 * PATCH /team/{teamId}
 * @tag Teams
 * @summary Edits a team's name
 * @description Edits team teamId with a name provided in body
 * @response 200 - OK
 */
router.patch('/:teamId', team.changeName);

/**
 * POST /team/{teamId}/join
 * @tag Teams
 * @summary Joins a team
 * @description Joins team with teamId, with invite ID in the body
 * @response 200 - OK
 */
router.post('/join', team.joinTeam);

export = router;