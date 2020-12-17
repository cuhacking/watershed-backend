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

const ENV = process.env.NODE_ENV || 'development';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Successful GET on /');
});

// Install routes as middleware here
router.use('/status', status);
router.use('/user', user);
router.use('/auth', auth);
router.use('/application', applications);

// Only mount these routes for testing
if(ENV === 'development') {
    router.use('/test', test);
}


export = router;