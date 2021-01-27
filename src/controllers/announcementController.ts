import {Announcement} from '../entity/Announcement'
import * as auth from '../middleware/authMiddleware';
import {getManager, MoreThan} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { Resource } from '../entity/Resource';
import {User} from '../entity/User';
import axios, {Method, AxiosResponse} from 'axios';

const DISCORD_URL = process.env.DISCORD_URL;
const ANNOUNCEMENT_CHANNEL = process.env.ANNOUNCEMENT_CHANNEL;

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
    const announcementRepository = getManager().getRepository(Announcement);

    let announcementData = req.body;

    if(!Array.isArray(announcementData)) {
        announcementData = [announcementData];
    }

    let addErrors: any[] = [];
    let successfulAdds: any[] = [];
    for(let announcement of announcementData) {
        //eslint-disable-next-line @typescript-eslint/ban-types
        const newAnnouncement = announcementRepository.create({...announcement} as Announcement); // This makes TypeORM not return an array...
        if(!newAnnouncement.time) {
            newAnnouncement.time = new Date();
        }
        const errors = await validate(newAnnouncement);
        if(errors.length > 0) {
            addErrors.push({announcement: newAnnouncement, error: errors});
        } else {
            try {
                await announcementRepository.save(newAnnouncement);
                successfulAdds.push(newAnnouncement);
                // Send the announcement request
                const method: Method = 'post';
                const url = { 
                    method: method, 
                    url: DISCORD_URL + '/upgrade',
                    data: {
                        message: newAnnouncement.description,
                        id: ANNOUNCEMENT_CHANNEL
                    }
                };

                const response = await axios(url);
                if(response.status !== 200) {
                    console.log('Error sending announcement: ' + response.data);
                }
            } catch (error) {
                addErrors.push({announcement: newAnnouncement, error: error});
            }
        }
    }

    if(addErrors.length > 0) {
        res.status(400).send(addErrors);
    } else {
        res.status(201).send(successfulAdds);
    }
    
}

export const getAnnouncement = async (req: Request, res: Response): Promise<void> => {
    const announcementRepository = getManager().getRepository(Announcement);
    const announcementId = parseInt(req.params.announcementId);
    const announcement = await announcementRepository.findOne({id: announcementId});

    if(announcement) {
        res.status(200).send(announcement);
    } else {
        res.sendStatus(404);
    }
}

export const getAllAnnouncements = async (req: Request, res: Response): Promise<void> => {
    const announcementRepository = getManager().getRepository(Announcement);
    const announcements = await announcementRepository.find();
    res.status(200).send(announcements);
}

export const editAnnouncement = async (req: Request, res: Response): Promise<void> => {
    const announcementRepository = getManager().getRepository(Announcement);

    const announcementId = parseInt(req.params.announcementId);
    const announcementData = req.body;
    
    try {
        let announcement = await announcementRepository.findOne({id: announcementId});
        if(!announcement) {
            res.sendStatus(404);
            return;
        }
        const modifiedAnnouncement = Object.assign(announcement, announcementData);
        await announcementRepository.save(modifiedAnnouncement);
        res.status(200).send(modifiedAnnouncement);
    } catch (err) {
        res.status(500).send(err);
    }
    
}

export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
    const announcementRepository = getManager().getRepository(Announcement);
    const announcement = await announcementRepository.findOne({id: parseInt(req.params.announcementId)});
    if(announcement){
        await announcementRepository.remove(announcement);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
}
