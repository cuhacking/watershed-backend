import express from 'express';
import { Request, Response } from 'express';

/**
 * Routes
 */
import status from './status';
import user from './user';
import auth from './auth';
import applications from './applications';
import test from './test';
<<<<<<< HEAD
import ravensQuest from './ravensQuest';
=======
import stats from './stats';
>>>>>>> master

const ENV = process.env.NODE_ENV || 'production';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Successful GET on /');
});

// Install routes as middleware here
router.use('/status', status);
router.use('/user', user);
router.use('/auth', auth);
router.use('/application', applications);
<<<<<<< HEAD
router.use('/ravensQuest', ravensQuest);
=======
router.use('/stats', stats);
>>>>>>> master

// Only mount these routes for testing
if(ENV === 'development') {
    router.use('/test', test);
}


export = router;