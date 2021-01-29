/*
Special testing endpoints
*/

import express from 'express';
import { Request, Response } from 'express';

import * as user from '../controllers/userController';
import * as auth from '../controllers/authController';
import * as authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.get('/checkConfirmed', authMiddleware.userIsConfirmed(), (req: Request, res: Response) => {
    res.send('Successful GET on /');
});

router.get('/getConfirmTokens', user.getConfirmationTokens);

router.get('/getResetTokens', auth.getResetTokens);

router.post('/adminUser', user.createAdminUser);

router.get('/sendEmail', user.sendAcceptEmails);

export = router;