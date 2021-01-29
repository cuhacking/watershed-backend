import {getManager, MoreThan} from 'typeorm';
import {Request, Response} from 'express';
import {User} from '../entity/User';
import {Points} from '../entity/Points';
import { nanoid } from 'nanoid';
import * as auth from '../middleware/authMiddleware';

export const generateCode = async (req: Request, res: Response): Promise<void> => {
    const pointsRepo = getManager().getRepository(Points);
    const pointValue = req.body.value;

    //eslint-disable-next-line @typescript-eslint/ban-types
    const code = nanoid(8).toUpperCase();
    const newPoints = pointsRepo.create({
        code: code,
        value: pointValue
    } as Points); // This makes TypeORM not return an array...

    try {
        await pointsRepo.save(newPoints);
        res.status(201).send(newPoints);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const redeemCode = async (req: Request, res: Response): Promise<void> => {
    const pointsRepo = getManager().getRepository(Points);
    const userRepo = getManager().getRepository(User);
    const code = req.body.code;

    if(!code) {
        res.status(400).send("Code not provided");
        return;
    }

    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['redeemedCodes']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    const points = await pointsRepo.findOne({code: code.trim().toUpperCase()});

    if(!points) {
        res.status(404).send('Invalid code');
    } else if(user.redeemedCodes && user.redeemedCodes.some(p => p.code == points.code)) {
        res.status(400).send('User has already redeemed this code');
    } else {
        user.points += points.value;
        if(!user.redeemedCodes) {
            user.redeemedCodes = [points];
        } else {
            user.redeemedCodes.push(points);
        }
        console.log(user);
        await userRepo.save(user);
        res.sendStatus(200);
    }
}

export const getCodes = async (req: Request, res: Response): Promise<void> => {
    const pointsRepo = getManager().getRepository(Points);
    const points = pointsRepo.find();
    res.status(200).send(points);
}