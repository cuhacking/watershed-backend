import express from 'express';
import * as auth from '../controllers/auth';

const router = express.Router();


// Create a user
router.post('/', auth.login);

export = router;