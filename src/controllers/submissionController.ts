import { Request, Response } from 'express';
import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import * as auth from '../middleware/authMiddleware';
import {getManager} from 'typeorm';
import { Submission } from '../entity/Submission';
import { Team } from '../entity/Team';
import { Challenge } from '../entity/Challenge';

const SUBMISSION_ROOT =
  process.env.SUBMISSION_DIR ?? __dirname + '/../../submissions/';

const git = simpleGit(SUBMISSION_ROOT);

const CONFIG_FILE = process.env.CONFIG_FILE;
let ENDTIME: Date = new Date('2020-01-31T12:30:00.000Z');
let GRACE_PERIOD = process.env.GRACE_PERIOD ? parseInt(process.env.GRACE_PERIOD) : 30;

// Result of a git-related action
export type GitResult = 'no-repo' | 'no-readme' | 'success' | 'error';

export interface SubmissionInput {
  readonly name: string;
  readonly repoUrl: string;
  readonly videoLink: string;
  readonly challenges: string[];
}

export const updateEndtime = async (): Promise<boolean> => {
  if(CONFIG_FILE) {
      try {
          const fileInput = await fs.readFile(CONFIG_FILE, 'utf-8');
          const inputJson = JSON.parse(fileInput);
          ENDTIME = new Date(inputJson.endTime);
          ENDTIME.setMinutes(ENDTIME.getMinutes() + GRACE_PERIOD);
          return true;
      } catch (err) {
          console.log(`Error reading file: ${err}`);
          return false;
      }
  }
  return true;
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

  // Check if repo already exists
  let exists: boolean;
  try {
    await fs.access(SUBMISSION_ROOT + name);
    exists = true;
  } catch (_) {
    exists = false;
  }

  if (!exists) {
    try {
      await git.clone(repo, name, {
        '--no-checkout': null,
        '--depth': 1,
        '--filter': 'blob:none',
      });
    } catch (e) {
      return 'no-repo';
    }
  }

  try {
    const localGit = simpleGit(SUBMISSION_ROOT + name);
    await localGit.checkout('origin', ['--', 'README.md']);
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
  const submissionRepo = getManager()
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

  const cloneResult = await cloneSubmission(repoUrl);
  if (cloneResult === 'no-repo') {
    res.status(404).send('Repo does not exist');
    return;
  } else if (cloneResult === 'no-readme') {
    res.status(404).send('README.md does not exist in repo');
    return;
  } else if (cloneResult === 'error') {
    res.status(500).send('Unspecified error');
    return;
  }

  const readme = await extractReadme(repoUrl);
  res.status(200).send(readme);
};

export const submitProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const submissionRepo = getManager().getRepository(Submission);
  const challengeRepo = getManager().getRepository(Challenge);
  const teamRepo = getManager().getRepository(Team);
  const token = req.header('Authorization')?.split(' ')[1];
  if(!token) {
      res.sendStatus(401);
      return;
  }

  const user = await auth.getUserObjectFromToken(token, ['team']);
  if(!user) {
      res.sendStatus(401);
      return;
  }

  if(!user.team) {
    res.status(400).send('User is not on a team');
    return;
  }

  if(new Date() > ENDTIME) {
    res.status(403).send("Submissions have closed");
    return;
  }

  const userTeam = await teamRepo.findOne({id: user.team.id}, {relations: ['submission']});
  
  let submissionData = null;
  if (req.body.body) {
    try {
      submissionData = JSON.parse(req.body.body) as SubmissionInput;
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
    return;
  } else if (cloneResult == 'no-readme') {
    res.status(404).send('No README.md');
    return;
  } else if (cloneResult === 'error') {
    res.status(500).send('Unspecified error');
    return;
  }

  const readme = await extractReadme(submissionData.repoUrl);
  if (readme == null) {
    res.sendStatus(500);
    return;
  }

  let submissionToSave;
  if(userTeam?.submission) {
    let renamedFields = {
      projectName: submissionData.name,
      demoVideo: submissionData.videoLink,
      repo: submissionData.repoUrl,
      team: user.team
    }
    submissionToSave = Object.assign(userTeam.submission, renamedFields);
  } else {
    submissionToSave = submissionRepo.create({
        projectName: submissionData.name,
        demoVideo: submissionData.videoLink,
        repo: submissionData.repoUrl,
        team: user.team
      } as Submission);
  }

  if(submissionData.challenges) {
    const challengesToAdd = [];
    for(let challenge of submissionData.challenges) {
      const challengeObj = await challengeRepo.findOne({name: challenge});
      if(challengeObj) {
        challengesToAdd.push(challengeObj);
      }
    }

    submissionToSave.challenges = challengesToAdd;
  }
  
  submissionToSave.readmeText = readme;
  submissionToSave.readmePath = SUBMISSION_ROOT + submissionData.name + '/README.md';

  if (req.files?.logo) {
    submissionToSave.imageLogo = req.files.logo.data;
  }

  if (req.files?.cover) {
    submissionToSave.imageCover = req.files.cover.data;
  }

  try {
    await submissionRepo.save(submissionToSave);
    res.sendStatus(200);
  } catch (e) {
    res.status(500).send(e);
  }

};

export const getSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  const repo = decodeURIComponent(req.params.repo);
  const submissionRepo = getManager().getRepository(Submission);

  const submission = await submissionRepo.findOne({repo: repo}, {relations: ['challenges']});
  if(submission) {
    res.status(200).send(submission);
  } else {
    res.sendStatus(404);
  }

}

export const getSubmissionPreviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  const submissionRepo = getManager().getRepository(Submission);
  const teamRepo = getManager().getRepository(Team);

  const output = [];
  const submissions = await submissionRepo.find({select: ['projectName', 'repo', 'imageLogo', 'imageCover']});

  for(const submission of submissions) {
    const team = await teamRepo.createQueryBuilder("team").leftJoinAndSelect("team.submission", "submission").getOne();
    output.push({...submission, team: team?.name});
  }
 

  if(output) {
    res.status(200).send(output);
  } else {
    res.sendStatus(404);
  }
}

export const clearImages = async (
  req: Request,
  res: Response
): Promise<void> => {
  const repo = decodeURIComponent(req.params.repo);
  const submissionRepo = getManager().getRepository(Submission);

  const submission = await submissionRepo.findOne({repo: repo});

  if(!submission) {
    res.sendStatus(404);
  } else {
    submission.imageCover = undefined;
    submission.imageLogo = undefined;
    await submissionRepo.save(submission);
    res.sendStatus(204);
  }
};
