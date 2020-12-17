import {User} from '../entity/User';
import * as auth from '../middleware/authMiddleware';
import {getManager} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as email from '../middleware/email';
import {EmailConfirmToken} from '../entity/EmailConfirmToken';

const HOSTNAME = process.env.EXTERNAL_HOSTNAME;
const CONFIRM_LINK = process.env.CONFIRM_LINK;

const sendConfirmationEmail = async (user: User) => {
    const confirmToken = await auth.generateToken(user.uuid, 'confirm');
    return (await email.sendEmail(user.email, 'cuHacking Password Reset', `
    Thanks for registering for a cuHacking account! Please click on the following link to confirm your email address:
    ${HOSTNAME + CONFIRM_LINK + '?token=' + confirmToken.token}
    `));
}

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
    userData.confirmed = false;

    //eslint-disable-next-line @typescript-eslint/ban-types
    const newUser = userRepository.create({...userData} as User); // This makes TypeORM not return an array...
    const errors = await validate(newUser);
    if(errors.length > 0) {
        res.status(400).send(errors);
    } else {
        // TODO: Better validation for email uniqueness
        try {
            await userRepository.save(newUser);
            // Login the new user
            const accessToken = await auth.generateToken(newUser.uuid, 'access');
            const refreshToken = await auth.generateToken(newUser.uuid, 'refresh');
            const emailRes = await sendConfirmationEmail(newUser);
            res.status(201).send({uuid: newUser.uuid, accessToken: accessToken, refreshToken: refreshToken});
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne({uuid: req.params.userId}, {select: ['uuid', 'email', 'firstName', 'lastName', 'role', 'githubId', 'discordId', 'confirmed']});
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

export const confirmEmail = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const checkResult = await auth.verifyToken(req.body.token, 'confirm');
    if(checkResult.result === auth.AuthTokenStatus.Valid && checkResult.uid) {
        const user = await userRepository.findOne({uuid: checkResult.uid});

        if(!user) {
            res.sendStatus(404);
            return;
        }

        if(user.confirmed) {
            res.status(200).send('Email is already confirmed');
            return;
        }

        user.confirmed = true;
        await userRepository.save(user);
        res.status(200).send('Email confirmed');
    } else {
        res.status(400).send('Invalid token');
    }
}

export const resendConfirmationEmail = async (req: Request, res: Response): Promise<void> => {
    const email = req.body.email;
    const userRepository = getManager().getRepository(User);
    const confirmTokenRepo = getManager().getRepository(EmailConfirmToken)
    const user = await userRepository.findOne({email: email});

    if(user && !user.confirmed) {
        // Invalidate all other confirmation tokens for this user
        const confirmationTokens = await confirmTokenRepo.find({uuid: user.uuid});
        confirmationTokens.forEach((element: EmailConfirmToken) => {
            confirmTokenRepo.remove(element);
        });

        const mailRes = await sendConfirmationEmail(user);
        if(!mailRes) {
            res.status(500).send('Something went wrong with the email');
        }
    }
    res.status(200).send('If an account with that email exists, you should receive an email shortly.');
};

// Testing purposes only
export const getConfirmationTokens = async (req: Request, res: Response): Promise<void> => {
    const confirmTokenRepo = getManager().getRepository(EmailConfirmToken)
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401);
        return;
    }

    const user = await auth.getUserObjectFromToken(token);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    const confirmationTokens = await confirmTokenRepo.find({uuid: user.uuid});
    res.status(200).send(confirmationTokens);
};