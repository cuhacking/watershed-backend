import express from 'express';
import { Request, Response } from 'express';

/**
 * Routes
 */
import status from './status';
import user from './user';
import auth from './auth';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Successful GET on /');
});

// Install routes as middleware here
router.use('/status', status);
router.use('/user', user);
router.use('/login', auth);

export = router;