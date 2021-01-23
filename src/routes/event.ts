/*
Special testing endpoints
*/

import express from 'express';
import { Request, Response } from 'express';

import * as event from '../controllers/eventController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

router.post('/', auth.authenticate(Role.Organizer), event.createEvent);
router.get('/', event.getAllEvents);

router.get('/upcoming', event.getUpcomingEvents);
router.get('/favourites', event.getFavourites);
router.get('/:eventId', event.getEvent);

router.post('/favourite', event.favouriteEvent);


router.patch('/favourites', event.removeFavourite);
router.patch('/:eventId', event.editEvent);

export = router;