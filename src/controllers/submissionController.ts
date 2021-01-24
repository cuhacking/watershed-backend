import { Request, Response } from 'express';
import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import * as auth from '../middleware/authMiddleware';

const SUBMISSION_ROOT =
  process.env.SUBMISSION_DIR ?? __dirname + '/../../submissions/';

const git = simpleGit(SUBMISSION_ROOT);

// Result of a git-related action
export type GitResult = 'no-repo' | 'no-readme' | 'success';

export interface Submission {
  readonly name: string;
  readonly repoUrl: string;
  readonly videoLink: string;
  readonly challenges: string[];
}

// Converts a repo url to a name based on that url
const stripRepoUrl = (repo: string): string => {
  const url = new URL(repo);
  return (url.hostname + url.pathname)
    .replace('com', '')
    .replace('/', '')
    .replace('.git', '');
};

const cloneSubmission = async (repo: string): Promise<GitResult> => {
  const name = stripRepoUrl(repo);
  try {
    await git.clone(repo, name, {
      '--no-checkout': null,
      '--depth': 1,
    });
  } catch (_) {
    return 'no-repo';
  }

  try {
    const localGit = simpleGit(SUBMISSION_ROOT + name);
    await localGit.checkout('HEAD', { '--': 'README.md' });
  } catch (_) {
    return 'no-readme';
  }

  return 'success';
};

const extractReadme = async (repo: string): Promise<string | null> => {
  const name = stripRepoUrl(repo);
  try {
    return await fs.readFile(SUBMISSION_ROOT + name + '/README.md', {
      encoding: 'utf-8',
    });
  } catch (_) {
    return null;
  }
};

export const getRepoPreview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    res.sendStatus(401); // User was not properly authenticated...
    return;
  }

  const uuid = auth.getUserFromToken(token);
  if (!uuid) {
    res.sendStatus(401); // User was not properly authenticated...
    return;
  }

  const repoUrl = decodeURIComponent(req.params.repo);
  console.log(repoUrl);

  const cloneResult = await cloneSubmission(repoUrl);
  if (cloneResult == 'no-repo') {
    res.status(404).send('Repo does not exist');
  } else if (cloneResult == 'no-readme') {
    res.status(404).send('README.md does not exist in repo');
  }

  const readme = await extractReadme(repoUrl);
  res.status(200).send(readme);
};

export const submitProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    res.sendStatus(401); // User was not properly authenticated...
    return;
  }

  const uuid = auth.getUserFromToken(token);
  if (!uuid) {
    res.sendStatus(401); // User was not properly authenticated...
    return;
  }

  // TODO: Check if user is in team, and that team has not already submitted project

  let submissionData = null;
  if (req.body.body) {
    try {
      submissionData = JSON.parse(req.body.body) as Submission;
    } catch (err) {
      res.status(400).send(err);
      return;
    }
  }

  if (submissionData == null) {
    res.status(400).send('Invalid body');
    return;
  }

  const cloneResult = await cloneSubmission(submissionData.repoUrl);
  if (cloneResult == 'no-repo') {
    res.status(404).send('No repo');
  } else if (cloneResult == 'no-readme') {
    res.status(404).send('No README.md');
  }

  const readme = await extractReadme(submissionData.repoUrl);
  if (readme == null) {
    res.sendStatus(500);
  }
  // TODO: Save README text

  if (req.files?.logo) {
    // TODO: Save logo image as a blob
  }

  if (req.files?.cover) {
    // TODO: Save cover image as a blob
  }
};

export const clearImages = async (
  req: Request,
  res: Response
): Promise<void> => {
  const repo = req.params.repo;

  // TODO: Delete images from project submission
}