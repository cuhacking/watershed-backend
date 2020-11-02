import {User} from '../entity/User';
import {getManager} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const users = await userRepository.find({select: ['uuid', 'email', 'firstName', 'lastName', 'role', 'githubId', 'discordId']});
    res.status(200).send(users);
}

export const createUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);

    const userData = req.body;
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(userData.password, salt);
    userData.password = password;
    userData.uuid = uuidv4();

    //eslint-disable-next-line @typescript-eslint/ban-types
    const newUser = userRepository.create({...userData} as User); // This makes TypeORM not return an array...
    const errors = await validate(newUser);
    if(errors.length > 0) {
        res.sendStatus(400);
    } else {
        // TODO: Better validation for email uniqueness
        try {
            await userRepository.save(newUser);
            const {uuid, email, firstName, lastName, role, githubId, discordId, ...rest} = newUser;
            const cleanUser = {uuid, email, firstName, lastName, role, githubId, discordId};
            res.status(201).send(cleanUser);
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne({uuid: req.params.userId}, {select: ['uuid', 'email', 'firstName', 'lastName', 'role', 'githubId', 'discordId']});
    if(user){
        res.status(200).send(user);
    } else {
        res.sendStatus(404);
    }
}

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne({uuid: req.params.userId});
    if(user){
        await userRepository.remove(user);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
}
