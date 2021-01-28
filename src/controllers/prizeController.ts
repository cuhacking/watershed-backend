import {Prize} from '../entity/Prize'
import * as auth from '../middleware/authMiddleware';
import {getManager, MoreThan} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { Resource } from '../entity/Resource';
import {User} from '../entity/User';

export const createPrize = async (req: Request, res: Response): Promise<void> => {
    const prizeRepository = getManager().getRepository(Prize);

    let prizeData = req.body;

    if(!Array.isArray(prizeData)) {
        prizeData = [prizeData];
    }

    let addErrors: any[] = [];
    let successfulAdds: any[] = [];
    for(let prize of prizeData) {
    
        //eslint-disable-next-line @typescript-eslint/ban-types
        const newPrize = prizeRepository.create({...prize} as Prize); // This makes TypeORM not return an array...
        const errors = await validate(newPrize);

        if(errors.length > 0) {
            addErrors.push({prize: newPrize, error: errors});
        } else {
            try {
                await prizeRepository.save(newPrize);
                successfulAdds.push(newPrize);
            } catch (error) {
                addErrors.push({prize: newPrize, error: error});
            }
        }
    }

    if(addErrors.length > 0) {
        res.status(400).send(addErrors);
    } else {
        res.status(201).send(successfulAdds);
    }
    
}

export const getPrize = async (req: Request, res: Response): Promise<void> => {
    const prizeRepository = getManager().getRepository(Prize);
    const prizeId = parseInt(req.params.prizeId);
    const prize = await prizeRepository.findOne({id: prizeId});

    if(prize) {
        res.status(200).send(prize);
    } else {
        res.sendStatus(404);
    }
}

export const getAllPrizes = async (req: Request, res: Response): Promise<void> => {
    const prizeRepository = getManager().getRepository(Prize);
    const prizes = await prizeRepository.find();
    res.status(200).send(prizes);
}

export const editPrize = async (req: Request, res: Response): Promise<void> => {
    const prizeRepository = getManager().getRepository(Prize);
    const prizeId = parseInt(req.params.prizeId);
    const prizeData = req.body;
    
    try {
        let prize = await prizeRepository.findOne({id: prizeId});
        if(!prize) {
            res.sendStatus(404);
            return;
        }
        const modifiedPrize = Object.assign(event, prizeData);
        await prizeRepository.save(modifiedPrize);
        res.status(200).send(modifiedPrize);
    } catch (err) {
        res.status(500).send(err);
    }
    
}

export const deletePrize = async (req: Request, res: Response): Promise<void> => {
    const prizeRepository = getManager().getRepository(Prize);
    const prize = await prizeRepository.findOne({id: parseInt(req.params.prizeId)});
    if(prize){
        await prizeRepository.remove(prize);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
}
