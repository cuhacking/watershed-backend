import express from 'express';

import * as team from '../controllers/teamController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

router.get('/', team.getTeams);
router.post('/', team.createTeam);

router.get('/my', team.getMyTeam);
router.get('/invites', team.getInvitesForUser);
router.get('/invites/:teamId', team.getInvitesForTeam);

router.get('/leave', team.leaveTeam);
router.post('/createInvite', team.createInvite);
router.delete('/invite/:inviteId', team.revokeInvite);

router.get('/:teamId', team.getTeam);
router.patch('/:teamId', team.changeName);
router.post('/:teamId/join', team.joinTeam);

export = router;