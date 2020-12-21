import {User, Role} from '../entity/User';
import * as auth from '../middleware/authMiddleware';
import {getManager} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const users = await userRepository.find({select: ['uuid', 'email', 'role', 'githubId', 'discordId']});
    res.status(200).send(users);
}

export const createUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);

    const userData = req.body;
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(userData.password, salt);
    userData.password = password;
    userData.uuid = uuidv4();

    if(!userData.role) {
        userData.role = Role.Hacker;
    }
    
    // Validate the email
    if(!EMAIL_REGEX.test(userData.email)) {
        res.status(400).send('Invalid email');
        return;
    }

    //eslint-disable-next-line @typescript-eslint/ban-types
    const newUser = userRepository.create({...userData} as User); // This makes TypeORM not return an array...
    const errors = await validate(newUser);
    if(errors.length > 0) {
        res.status(400).send(errors);
    } else {
        try {
            await userRepository.save(newUser);
            // Login the new user
            const accessToken = await auth.generateToken(newUser.uuid, 'access');
            const refreshToken = await auth.generateToken(newUser.uuid, 'refresh');
            res.status(201).send({uuid: newUser.uuid, accessToken: accessToken, refreshToken: refreshToken});
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne({uuid: req.params.userId}, {select: ['uuid', 'email', 'role', 'githubId', 'discordId']});
    if(user){
        res.status(200).send(user);
    } else {
        res.sendStatus(404);
    }
}

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    // Grab currently logged in user
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    res.status(200).send({
        uuid: user.uuid,
        email: user.email,
        role: user.role,
        githubId: user.githubId,
        discordId: user.discordId
    });
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
