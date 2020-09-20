import express from 'express';
import { Request, Response } from 'express';

/**
 * Routes
 */
import ping from './ping';
import user from './user';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Successful GET on /');
});

// Install routes as middleware here
router.use('/ping', ping);
router.use('/user', user);

export = router;