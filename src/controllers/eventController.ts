import {Event} from '../entity/Event'
import * as auth from '../middleware/authMiddleware';
import {getManager} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { Resource } from '../entity/Resource';
import {User} from '../entity/User';

export const createEvent = async (req: Request, res: Response): Promise<void> => {
    const eventRepository = getManager().getRepository(Event);
    const resourceRepository = getManager().getRepository(Resource);

    let eventData = req.body;

    if(!Array.isArray(eventData)) {
        eventData = [eventData];
    }

    let addErrors: any[] = [];
    let successfulAdds: any[] = [];
    for(let event of eventData) {
        if(!event.startTime) {
            res.status(400).send("Missing start time");
            return;
        }
        event.startTime = new Date(event.startTime);
        if(event.endTime) {
            event.endTime = new Date(event.endTime);
        }
    
        //eslint-disable-next-line @typescript-eslint/ban-types
        const newEvent = eventRepository.create({...event} as Event); // This makes TypeORM not return an array...
        const errors = await validate(newEvent);
        if(event.resources) {
            let resourcesToAdd = [];
            for(let resource of event.resources) {
                const newResource = resourceRepository.create({...resource} as Resource);
                await resourceRepository.save(newResource);
                resourcesToAdd.push(newResource);
            }
            newEvent.resources = resourcesToAdd;
        }
        if(errors.length > 0) {
            addErrors.push({event: newEvent, error: errors});
        } else {
            try {
                await eventRepository.save(newEvent);
                successfulAdds.push(newEvent);
            } catch (error) {
                addErrors.push({event: newEvent, error: error});
            }
        }
    }

    if(addErrors.length > 0) {
        res.status(400).send(addErrors);
    } else {
        res.status(201).send(successfulAdds);
    }
    
}

export const getEvent = async (req: Request, res: Response): Promise<void> => {
    const eventRepository = getManager().getRepository(Event);
    const eventId = parseInt(req.params.eventId);
    const event = await eventRepository.findOne({id: eventId}, {relations: ['resources']});

    if(event) {
        res.status(200).send(event);
    } else {
        res.sendStatus(404);
    }
}

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
    const eventRepository = getManager().getRepository(Event);
    const events = await eventRepository.find({relations: ['resources']});
    res.status(200).send(events);
}

export const getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
    const eventRepository = getManager().getRepository(Event);
    const currentTime = new Date();
    let numToGet = 5; // Default to 5
    if(req.query.num) {
        numToGet = parseInt(req.query.num as string);
    }

    const events = await eventRepository
        .createQueryBuilder()
        .where('startTime > :now', {now: currentTime})
        .leftJoinAndSelect('resources', 'resource')
        .orderBy('startTime')
        .limit(numToGet);

    res.status(200).send(events);
}

export const editEvent = async (req: Request, res: Response): Promise<void> => {
    const eventRepository = getManager().getRepository(Event);
    const eventId = parseInt(req.params.eventId);
    const eventData = req.body;
    
    try {
        let event = await eventRepository.findOne({id: eventId}, {relations: ['resources']});
        if(!event) {
            res.sendStatus(404);
            return;
        }
        const modifiedEvent = Object.assign(event, eventData);
        await eventRepository.save(modifiedEvent);
        res.status(200).send(modifiedEvent);
    } catch (err) {
        res.status(500).send(err);
    }
    
}

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
    const eventRepository = getManager().getRepository(Event);
    const event = await eventRepository.findOne({id: parseInt(req.params.eventId)});
    if(event){
        await eventRepository.remove(event);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
}

export const favouriteEvent = async (req: Request, res: Response): Promise<void> => {
    // Grab currently logged in user
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['favouriteEvents']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    const eventId = parseInt(req.body.eventId);
    if(!eventId) { 
        res.status(400).send("eventId missing");
        return;
    }
    
    const userRepository = getManager().getRepository(User);
    const eventRepository = getManager().getRepository(Event);
    const event = await eventRepository.findOne({id: eventId});

    if(!event) {
        res.status(404).send('Event not found');
    } else {
        if(!user.favouriteEvents) {
            user.favouriteEvents = [event];
        } else {
            user.favouriteEvents.push(event);
        }
        await userRepository.save(user);
        res.sendStatus(200);
    }
}

export const getFavourites = async (req: Request, res: Response): Promise<void> => {
    // Grab currently logged in user
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['favouriteEvents']);
    if(!user) {
        res.sendStatus(401);
        return;
    }
    res.status(200).send(user.favouriteEvents);
}

export const removeFavourite = async (req: Request, res: Response): Promise<void> => {
    // Grab currently logged in user
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['favouriteEvents']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    const eventId = parseInt(req.body.eventId);
    if(!eventId) { 
        res.status(400).send("eventId missing");
        return;
    }

    const userRepository = getManager().getRepository(User);
    if(!user.favouriteEvents) {
        res.status(400).send('User has no favourited events');
    } else {
        user.favouriteEvents = user.favouriteEvents.filter(event => event.id !== eventId);
        await userRepository.save(user);
        res.sendStatus(200);
    }
}