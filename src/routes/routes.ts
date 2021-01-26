import express from 'express';
import { Request, Response } from 'express';

/**
 * Routes
 */
import status from './status';
import user from './user';
import auth from './auth';
import team from './team';
import applications from './applications';
import test from './test';
import event from './event';
import ravensQuest from './ravensQuest';
import stats from './stats';
import submission from './submission';
import dashboard from './dashboard';

const ENV = process.env.NODE_ENV || 'production';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Successful GET on /');
});

// Install routes as middleware here
router.use('/status', status);
router.use('/user', user);
router.use('/auth', auth);
router.use('/team', team);
router.use('/application', applications);
router.use('/event', event);
router.use('/ravensQuest', ravensQuest);
router.use('/stats', stats);
router.use('/submission', submission)
router.use('/dashboard', dashboard);

// Only mount these routes for testing
if(ENV === 'development') {
    router.use('/test', test);
}


export = router;