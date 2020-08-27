import express from 'express';
import { Request, Response } from 'express';

/**
 * Routes
 */
import ping from './ping';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Successful GET on /');
});

// Install routes as middleware here
router.use('/ping', ping);

export = router;