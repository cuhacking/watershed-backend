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

const QUESTIONS_FILE = process.env.QUESTIONS_FILE;
let questionsAndAnswers: any = null;

const loadQuestionsAndAnswers = async (): Promise<boolean> => {
    if(QUESTIONS_FILE) {
        try {
            questionsAndAnswers = await fs.readFile(QUESTIONS_FILE, 'utf-8');
            return true;
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
        res.status(400).send("User has already started the Raven's Quest");
        return;
    }

    delete user.ravensQuestProgress;
    const rqProgress = rqRepo.create({
        user: user,
        track0Progress: 0,
        track1Progress: 0,
        track2Progress: 0,
        track3Progress: 0,
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
        res.status(400).send("User has not started the Raven's Quest yet");
        return;
    }
    if(track < 0 || track > 3) {
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
    if(req.body) {
        console.log('Using questions provided in request body...');
        questionsAndAnswers = req.body;
        res.sendStatus(200);
    } else {
        console.log('Attempting to load questions from file...');
        const result = await loadQuestionsAndAnswers();
        if(result) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
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
        res.status(400).send("User has not started the Raven's Quest yet");
        return;
    }
    const currentTrack = user.ravensQuestProgress.currentTrack.toString();
    const currentQuestion = user.ravensQuestProgress[`track${currentTrack}Progress`].toString(); // This is probably bad but I'm too lazy to do 4 if statements

    if(currentQuestion == 4) { // Assign 4 if they are done the questions in the track (assuming 4 questions per track)
        res.status(400).send('Track is already complete! Please switch to a different track.') // Should this send a different status from incorrect? Or should I return an object with a status?
    }
    if(questionsAndAnswers[currentTrack][currentQuestion]?.answer == answer) {
        user.ravensQuestProgress[`track${currentTrack}Progress`]++;
        await rqRepo.save(user.ravensQuestProgress);
        if(user.ravensQuestProgress[`track${currentTrack}Progress`] == 4) {
            res.status(200).send({
                "track": currentTrack,
                "progress": "completed",
                "snowmanName": questionsAndAnswers[currentTrack].snowmanName
            });
        } else {
            const nextQuestion = user.ravensQuestProgress[`track${currentTrack}Progress`].toString();
            res.status(200).send({
                "track": currentTrack,
                "progress": user.ravensQuestProgress[`track${currentTrack}Progress`],
                "nextQuestion": questionsAndAnswers[currentTrack][nextQuestion]?.question
            });
        }
        
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
        res.status(400).send("User has not started the Raven's Quest yet");
        return;
    }
    console.log(user.ravensQuestProgress);
    const currentTrack = user.ravensQuestProgress.currentTrack.toString();
    const currentQuestion = user.ravensQuestProgress[`track${currentTrack}Progress`].toString(); // This is probably bad but I'm too lazy to do 4 if statements

    if(currentQuestion == 4) { // Assign 4 if they are done the questions in the track (assuming 4 questions per track)
        res.status(200).send('Track completed!') // Should this send a different status from incorrect? Or should I return an object with a status?
    } else {
        res.status(200).send(questionsAndAnswers[currentTrack][currentQuestion]?.question);
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
        "track0": user.ravensQuestProgress.track0Progress === 4 ? 'Completed' : user.ravensQuestProgress.track0Progress,
        "track1": user.ravensQuestProgress.track1Progress === 4 ? 'Completed' : user.ravensQuestProgress.track1Progress,
        "track2": user.ravensQuestProgress.track2Progress === 4 ? 'Completed' : user.ravensQuestProgress.track2Progress,
        "track3": user.ravensQuestProgress.track3Progress === 4 ? 'Completed' : user.ravensQuestProgress.track3Progress,
        "currentTrack": user.ravensQuestProgress.currentTrack
    });
};