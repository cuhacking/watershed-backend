import {Challenge} from '../entity/Challenge'
import * as auth from '../middleware/authMiddleware';
import {getManager, MoreThan} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { Resource } from '../entity/Resource';
import {User} from '../entity/User';
import { Prize } from '../entity/Prize';
import { Submission } from '../entity/Submission';

export const createChallenge = async (req: Request, res: Response): Promise<void> => {
    const challengeRepository = getManager().getRepository(Challenge);
    const prizeRepository = getManager().getRepository(Prize);

    let challengeData = req.body;

    if(!Array.isArray(challengeData)) {
        challengeData = [challengeData];
    }

    let addErrors: any[] = [];
    let successfulAdds: any[] = [];
    for(let challenge of challengeData) {
    
        //eslint-disable-next-line @typescript-eslint/ban-types
        const newChallenge = challengeRepository.create({...challenge} as Challenge); // This makes TypeORM not return an array...
        const errors = await validate(newChallenge);
        if(challenge.prizes) {
            let prizesToAdd = [];
            for(let prize of challenge.prizes) {
                if(typeof prize === 'string') {
                    const existingPrize = await prizeRepository.findOne({name: prize});
                    if(existingPrize) {
                        prizesToAdd.push(existingPrize);
                    }
                } else {
                    const newPrize = prizeRepository.create({...prize} as Prize);
                    await prizeRepository.save(newPrize);
                    prizesToAdd.push(newPrize);
                }                
            }
            newChallenge.prizes = prizesToAdd;
        }
        if(errors.length > 0) {
            addErrors.push({challenge: newChallenge, error: errors});
        } else {
            try {
                await challengeRepository.save(newChallenge);
                successfulAdds.push(newChallenge);
            } catch (error) {
                addErrors.push({challenge: newChallenge, error: error});
            }
        }
    }

    if(addErrors.length > 0) {
        res.status(400).send(addErrors);
    } else {
        res.status(201).send(successfulAdds);
    }
    
}

export const getChallenge = async (req: Request, res: Response): Promise<void> => {
    const challengeRepository = getManager().getRepository(Challenge);
    const challengeId = parseInt(req.params.challengeId);
    const challenge = await challengeRepository.findOne({id: challengeId}, {relations: ['prizes']});

    if(challenge) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(404);
    }
}

export const getAllChallenges = async (req: Request, res: Response): Promise<void> => {
    const challengeRepository = getManager().getRepository(Challenge);
    const challenges = await challengeRepository.find({relations: ['prizes']});
    res.status(200).send(challenges);
}

export const editChallenge = async (req: Request, res: Response): Promise<void> => {
    const challengeRepository = getManager().getRepository(Challenge);
    const prizeRepository = getManager().getRepository(Prize);
    const challengeId = parseInt(req.params.challengeId);
    const challengeData = req.body;
    
    try {
        let challenge = await challengeRepository.findOne({id: challengeId}, {relations: ['prizes']});
        if(!challenge) {
            res.sendStatus(404);
            return;
        }
        const modifiedChallenge = Object.assign(challenge, challengeData);
        if(challengeData.prizes) {
            let prizesToAdd = [];
            for(let prize of challengeData.prizes) {
                if(typeof prize === 'string') {
                    const existingPrize = await prizeRepository.findOne({name: prize});
                    if(existingPrize) {
                        prizesToAdd.push(existingPrize);
                    }
                } else {
                    const newPrize = prizeRepository.create({...prize} as Prize);
                    await prizeRepository.save(newPrize);
                    prizesToAdd.push(newPrize);
                }                
            }
            modifiedChallenge.prizes = prizesToAdd;
        }
        await challengeRepository.save(modifiedChallenge);
        res.status(200).send(modifiedChallenge);
    } catch (err) {
        res.status(500).send(err);
    }
    
}

export const deleteChallenge = async (req: Request, res: Response): Promise<void> => {
    const challengeRepository = getManager().getRepository(Challenge);
    const challenge = await challengeRepository.findOne({id: parseInt(req.params.challengeId)});
    if(challenge){
        await challengeRepository.remove(challenge);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
}

export const setWinner = async (req: Request, res: Response): Promise<void> => {
    const challengeRepo = getManager().getRepository(Challenge);
    const submissionRepo = getManager().getRepository(Submission);

    const submissionId = req.body.submissionId;
    const challengeId = req.body.challengeId;

    const submission = await submissionRepo.findOne({id: submissionId});
    const challenge = await challengeRepo.findOne({id: challengeId});

    if(submission && challenge) {
        submission.winner = challenge;
        await submissionRepo.save(submission);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
}

export const getAllWinners = async (req: Request, res: Response): Promise<void> => {
    const submissionRepo = getManager().getRepository(Submission);

    const winners = await submissionRepo
                    .createQueryBuilder("submission")
                    .innerJoinAndSelect('submission.winner', 'winner')
                    .getMany();

    res.status(200).send(winners);
}