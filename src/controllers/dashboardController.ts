import {Request, Response} from 'express';
import * as auth from '../middleware/authMiddleware';
import {User, Role} from '../entity/User';
import {Event} from '../entity/Event';
import {getManager, MoreThan} from 'typeorm';
import { promises as fs } from 'fs';

let ENDTIME: Date = new Date('2021-01-31T12:00:00.000Z');
let STARTTIME = new Date('2021-01-30T12:00:00.000Z');
const CONFIG_FILE = process.env.CONFIG_FILE;

export const updateStartEndTime = async (): Promise<boolean> => {
    if(CONFIG_FILE) {
        try {
            const fileInput = await fs.readFile(CONFIG_FILE, 'utf-8');
            const inputJson = JSON.parse(fileInput);
            STARTTIME = inputJson.startTime;
            ENDTIME = inputJson.endTime;
            return true;
        } catch (err) {
            console.log(`Error reading file: ${err}`);
            return false;
        }
    }
    return true;
}

export const triggerUpdateTime = async (req: Request, res: Response): Promise<void> => {
    const result = await updateStartEndTime();
    if(result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

export const getDashboardInfo = async (req: Request, res: Response): Promise<void> => {
    // Grab currently logged in user
    const eventRepository = getManager().getRepository(Event);
    const currentTime = new Date();

    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team', 'submission']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    
    let numToGet = 5; // Default to 5
    if(req.query.num) {
        numToGet = parseInt(req.query.num as string);
    }
    const events = await eventRepository.find({
        where: {startTime: MoreThan(currentTime.toISOString())},
        relations: ['resources'],
        take: numToGet,
        order: {
            startTime: "ASC"
        }
    });

    res.status(200).send({
        user: user,
        schedule: events,
        startTime: STARTTIME,
        endTime: ENDTIME
    });

};
