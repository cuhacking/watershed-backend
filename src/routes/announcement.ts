/*
Special testing endpoints
*/

import express from 'express';
import { Request, Response } from 'express';

import * as announcement from '../controllers/announcementController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * POST /announcement
 * @tag Announcements
 * @summary Create an event
 * @description Creates an event. Must be done by an admin
 * @bodyContent {Event} application/json
 * @bodyRequired
 * @response 201 - Created
 */
router.post('/', auth.authenticate(Role.Organizer), announcement.createAnnouncement);

/**
 * GET /announcement
 * @tag Announcements
 * @summary Gets all Announcements
 * @response 200 - List of Announcements
 * @responseContent {Event} 200.application/json
 */
router.get('/', announcement.getAllAnnouncements);

/**
 * GET /announcement/{announcementId}
 * @tag Event
 * @summary Gets a specific event
 * @response 200 - Event
 * @responseContent {Event} 200.application/json
 */
router.get('/:announcementId', announcement.getAnnouncement);

/**
 * DELETE /announcement/{announcementId}
 * @tag Event
 * @summary Deletes an event
 * @response 200 - Event
 * @responseContent {Event} 200.application/json
 */
router.delete('/:announcementId', auth.authenticate(Role.Organizer), announcement.deleteAnnouncement);

/**
 * PATCH /announcement/{announcementId}
 * @tag Event
 * @summary Modifies an event
 * @description Modifies event with announcementId in body
 * @response 200 - OK
 */
router.patch('/:announcementId', auth.authenticate(Role.Organizer), announcement.editAnnouncement);

export = router;