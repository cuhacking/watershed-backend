import express from 'express';

import * as submission from '../controllers/submissionController';
import * as auth from '../middleware/authMiddleware';

import {Role} from '../entity/User';

const router = express.Router();

/**
 * GET /submission/preview/{repo}
 * @tag Submissions
 * @summary Gets the README.md file of a git repo
 * @pathParam {string} repo - the url of the git repo to fetch
 * @response 200 - The README.md file contents
 */
router.get('/preview/:repo', submission.getRepoPreview);

/**
 * GET /submission
 * @tag Submissions
 * @summary Gets a preview (no readme, no video) of all submissions
 * @response 200 - An array of submissions
 */
router.get('/', submission.getSubmissionPreviews);

router.get('/winners', submission.getWinners);

/**
 * POST /submission
 * @tag Submissions
 * @summary Submit a project
 * 
 */
router.post('/', submission.submitProject);

/**
 * POST /{repo}
 * @tag Submissions
 * @summary Deletes all project submission's images
 */
router.post('/:repo', auth.authenticate(Role.Organizer), submission.clearImages);

router.get('/:repo', submission.getSubmission);

router.get('/:repo/cover', submission.getSubmissionImage);


export = router;