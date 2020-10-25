import {User} from '../entity/User';
import {getManager} from "typeorm";
import {Request, Response} from "express";
import {validate} from "class-validator";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const users = await userRepository.find();
    res.status(200).send(users);
}

export const createUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const newUser = userRepository.create(req.body);
    const errors = await validate(newUser);
    if(errors.length > 0) {
        res.sendStatus(400);
    } else {
        // TODO: Better validation for email uniqueness
        try {
            await userRepository.save(newUser);
            res.status(201).send(newUser);
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne(req.params.userId);
    if(user){
        res.status(200).send(user);
    } else {
        res.sendStatus(404);
    }
}

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne(req.params.userId);
    if(user){
        await userRepository.remove(user);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
}
