import express from 'express';

import * as user from '../controllers/user';

const router = express.Router();

// Get all users
router.get('/', user.getUsers);
// Create a user
router.post('/', user.createUser);
// Get a single user by ID
router.get('/:userId', user.getUser);
// Delete a user
router.delete('/:userId', user.deleteUser);

export = router;