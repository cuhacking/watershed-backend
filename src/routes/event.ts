/*
Special testing endpoints
*/

import express from 'express';
import { Request, Response } from 'express';

import * as event from '../controllers/eventController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * POST /event
 * @tag Events
 * @summary Create an event
 * @description Creates an event. Must be done by an admin
 * @bodyContent {Event} application/json
 * @bodyRequired
 * @response 201 - Created
 */
router.post('/', auth.authenticate(Role.Organizer), event.createEvent);

/**
 * GET /event
 * @tag Events
 * @summary Gets all events
 * @response 200 - List of events
 * @responseContent {Event} 200.application/json
 */
router.get('/', event.getAllEvents);

/**
 * GET /event/upcoming
 * @tag Event
 * @summary Gets next num events
 * @queryParam {integer} num - Number of events to fetch. Default 5.
 * @response 200 - List of events
 * @responseContent {Event[]} 200.application/json
 */
router.get('/upcoming', event.getUpcomingEvents);

/**
 * GET /event/favourites
 * @tag Event
 * @summary Gets favourite events for user
 * @response 200 - List of events
 * @responseContent {Event[]} 200.application/json
 */
router.get('/favourites', event.getFavourites);

/**
 * GET /event/{eventId}
 * @tag Event
 * @summary Gets a specific event
 * @response 200 - Event
 * @responseContent {Event} 200.application/json
 */
router.get('/:eventId', event.getEvent);

/**
 * POST /event/favourite
 * @tag Event
 * @summary Favourites an event
 * @description Favourites event with eventId in body
 * @response 200 - OK
 */
router.post('/favourite', event.favouriteEvent);

/**
 * PATCH /event/favourits
 * @tag Event
 * @summary Removes a favourited event
 * @description Removes event with eventId in body
 * @response 200 - OK
 */
router.patch('/favourites', event.removeFavourite);

/**
 * PATCH /event/favourits
 * @tag Event
 * @summary Modifies an event
 * @description Modifies event with eventId in body
 * @response 200 - OK
 */
router.patch('/:eventId', event.editEvent);

export = router;