import {User, Role} from '../entity/User';
import * as auth from '../middleware/authMiddleware';
import {getManager} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as email from '../middleware/email';
import {EmailConfirmToken} from '../entity/EmailConfirmToken';
import { RavensQuest } from '../entity/RavensQuest';
import { promises as fs } from 'fs';

const CONFIG_FILE = process.env.CONFIG_FILE;
const NUM_QUESTIONS = 4;

let questionsAndAnswers: any = null;

export const loadQuestionsAndAnswers = async (): Promise<boolean> => {
    if(CONFIG_FILE) {
        try {
            const fileInput = await fs.readFile(CONFIG_FILE, 'utf-8');
            const questionsAndAnswers = JSON.parse(fileInput).ravensQuest
            return !!questionsAndAnswers; // Convert to boolean
        } catch (err) {
            console.log(`Error reading file: ${err}`);
            return false;
        }
    }
    return false;
}

export const startQuest = async (req: Request, res: Response): Promise<void> => {
    const userId = req.body.userId; // Note this is the Discord Id
    const userRepo = getManager().getRepository(User);
    const rqRepo = getManager().getRepository(RavensQuest);

    const user = await userRepo.findOne({discordId: userId}, {relations: ['ravensQuestProgress']});
    if(!user) {
        res.status(404).send('User not found');
        return;
    }

    if(user.ravensQuestProgress) {
        res.status(403).send("User has already started the Raven's Quest");
        return;
    }

    delete user.ravensQuestProgress;
    const rqProgress = rqRepo.create({
        user: user,
        track0Progress: 0,
        track1Progress: 0,
        track2Progress: 0,
        currentTrack: 0
    });

    try {
        await rqRepo.save(rqProgress);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err);
    }    
};

export const switchTracks = async (req: Request, res: Response): Promise<void> => {
    const userId = req.body.userId;
    const track = req.body.track;
    const userRepo = getManager().getRepository(User);
    const rqRepo = getManager().getRepository(RavensQuest);

    const user = await userRepo.findOne({discordId: userId}, {relations: ['ravensQuestProgress']});
    if(!user) {
        res.status(404).send('User not found');
        return;
    }
    if(!user.ravensQuestProgress) {
        res.status(403).send("User has not started the Raven's Quest yet");
        return;
    }
    if(track < 0 || track > 2) {
        res.status(400).send('Invalid track');
    }    
    user.ravensQuestProgress.currentTrack = track;

    try {
        await rqRepo.save(user.ravensQuestProgress);
        res.status(200).send(JSON.stringify(track));
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }    
    
};

export const refreshQuestionsAndAnswers = async (req: Request, res: Response): Promise<void> => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Attempting to load questions from file...');
        const result = await loadQuestionsAndAnswers();
        if(result) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    } else {
        console.log('Using questions provided in request body...');
        questionsAndAnswers = req.body;
        res.sendStatus(200);
    }
};

export const submitAnswer = async (req: Request, res: Response): Promise<void> => {
    const userId = req.body.userId;
    const answer = req.body.answer;
    const userRepo = getManager().getRepository(User);
    const rqRepo = getManager().getRepository(RavensQuest);
    const user = await userRepo.findOne({discordId: userId}, {relations: ['ravensQuestProgress']});
    if(!user) {
        res.status(404).send('User not found');
        return;
    }
    if(!user.ravensQuestProgress) {
        res.status(403).send("User has not started the Raven's Quest yet");
        return;
    }
    const currentTrack = user.ravensQuestProgress.currentTrack.toString();
    const currentQuestion = user.ravensQuestProgress[`track${currentTrack}Progress`].toString(); // This is probably bad but I'm too lazy to do 4 if statements

    if(currentQuestion == NUM_QUESTIONS) { // Assign 4 if they are done the questions in the track (assuming 4 questions per track)
        res.status(405).send('Track is already complete! Please switch to a different track.') // Should this send a different status from incorrect? Or should I return an object with a status?
        return;
    }
    if(questionsAndAnswers[currentTrack][currentQuestion]?.answer.toLowerCase() == answer.toLowerCase()) {
        user.ravensQuestProgress[`track${currentTrack}Progress`]++;
        await rqRepo.save(user.ravensQuestProgress);

        const allComplete = user.ravensQuestProgress[`track0Progress`] == NUM_QUESTIONS &&
                            user.ravensQuestProgress[`track1Progress`] == NUM_QUESTIONS &&
                            user.ravensQuestProgress[`track2Progress`] == NUM_QUESTIONS;

        let nextQuestion;
        let nextQuestionUrl;

        if(user.ravensQuestProgress[`track${currentTrack}Progress`] == NUM_QUESTIONS) {
            nextQuestion = null;
            nextQuestionUrl = null;
        } else {
            nextQuestion = questionsAndAnswers[currentTrack][user.ravensQuestProgress[`track${currentTrack}Progress`]]?.question;
            nextQuestionUrl = questionsAndAnswers[currentTrack][user.ravensQuestProgress[`track${currentTrack}Progress`]]?.questionUrl;
        }

        res.status(200).send({
            track: currentTrack,
            progress: user.ravensQuestProgress[`track${currentTrack}Progress`] == NUM_QUESTIONS ? "completed" : user.ravensQuestProgress[`track${currentTrack}Progress`],
            snowmanUrl: questionsAndAnswers[currentTrack][currentQuestion]?.snowmanUrl,
            snowmanName: questionsAndAnswers[currentTrack][currentQuestion]?.snowmanName,
            allComplete: allComplete,
            nextQuestion: nextQuestion,
            nextQuestionUrl: nextQuestionUrl
        });
        
    } else {
        res.status(400).send('Incorrect answer.');
    }
};

export const getQuestion = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const userRepo = getManager().getRepository(User);
    const user = await userRepo.findOne({discordId: userId}, {relations: ['ravensQuestProgress']});
    if(!user) {
        res.status(404).send('User not found');
        return;
    }
    if(!user.ravensQuestProgress) {
        res.status(403).send("User has not started the Raven's Quest yet");
        return;
    }

    const currentTrack = user.ravensQuestProgress.currentTrack.toString();
    const currentQuestion = user.ravensQuestProgress[`track${currentTrack}Progress`].toString(); // This is probably bad but I'm too lazy to do 4 if statements

    if(currentQuestion == NUM_QUESTIONS) { // Assign 4 if they are done the questions in the track (assuming 4 questions per track)
        res.status(405).send('Track completed!')
    } else {
        res.status(200).send({
            question: questionsAndAnswers[currentTrack][currentQuestion]?.question,
            questionUrl: questionsAndAnswers[currentTrack][currentQuestion]?.questionUrl
        });
    }
};

export const getProgress = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const userRepo = getManager().getRepository(User);
    const user = await userRepo.findOne({discordId: userId}, {relations: ['ravensQuestProgress']});
    if(!user) {
        res.status(404).send('User not found');
        return;
    }
    if(!user.ravensQuestProgress) {
        res.status(200).send("User has not started the Raven's Quest yet");
        return;
    }
    res.status(200).send({
        "track0": user.ravensQuestProgress.track0Progress === NUM_QUESTIONS ? 'Completed' : user.ravensQuestProgress.track0Progress,
        "track1": user.ravensQuestProgress.track1Progress === NUM_QUESTIONS ? 'Completed' : user.ravensQuestProgress.track1Progress,
        "track2": user.ravensQuestProgress.track2Progress === NUM_QUESTIONS ? 'Completed' : user.ravensQuestProgress.track2Progress,
        "currentTrack": user.ravensQuestProgress.currentTrack
    });
};


export const getCurrentUserProgress = async (req: Request, res: Response): Promise<void> => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401);
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['ravensQuestProgress']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    if(!user.ravensQuestProgress) {
        res.status(200).send({});
        return;
    }
    
    res.status(200).send({
        "track0": user.ravensQuestProgress.track0Progress === NUM_QUESTIONS ? 'Completed' : user.ravensQuestProgress.track0Progress,
        "track1": user.ravensQuestProgress.track1Progress === NUM_QUESTIONS ? 'Completed' : user.ravensQuestProgress.track1Progress,
        "track2": user.ravensQuestProgress.track2Progress === NUM_QUESTIONS ? 'Completed' : user.ravensQuestProgress.track2Progress,
        "currentTrack": user.ravensQuestProgress.currentTrack
    });
};
