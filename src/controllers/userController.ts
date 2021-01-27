import {User, Role} from '../entity/User';
import * as auth from '../middleware/authMiddleware';
import {getManager} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as email from '../middleware/email';
import {EmailConfirmToken} from '../entity/EmailConfirmToken';
import axios, {Method, AxiosResponse} from 'axios';

const HOSTNAME = process.env.EXTERNAL_HOSTNAME;
const CONFIRM_LINK = process.env.CONFIRM_LINK || '';
const CONFIRM_TEMPLATE = process.env.CONFIRM_TEMPLATE || '';

const DISCORD_URL = process.env.DISCORD_URL;
const DISCORD_ROLE = process.env.DISCORD_ROLE;

const sendConfirmationEmail = async (user: User) => {
    const confirmToken = await auth.generateToken(user.uuid, 'confirm');
    if(!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
        return false;
    }

    const mailTemplate = await email.createEmailTemplate(CONFIRM_TEMPLATE);
    if(!mailTemplate) {
        throw new Error('Email templating failed');
    }

    const mailText = mailTemplate({URL: HOSTNAME + CONFIRM_LINK + '?token=' + confirmToken.token, EMAIL: user.email});

    return (await email.sendEmail(user.email, 'cuHacking Password Reset', mailText));
}

export const assignDiscordRole = async (discordId: string): Promise<AxiosResponse|undefined> => {
    if(!discordId) {
        return undefined;
    } else {

        // Send the role request
        const method: Method = 'post';
        const url = { 
            method: method, 
            url: DISCORD_URL + '/upgrade',
            data: {
                roleId: DISCORD_ROLE,
                id: discordId
            }
        };

        const response = await axios(url);
        return response;
    }
}

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
    userData.confirmed = false;
    userData.role = Role.Hacker; // Force all users to be Hackers
    userData.email = userData.email?.toLowerCase();
    
    // Validate the email
    if(!EMAIL_REGEX.test(userData.email)) {
        res.status(400).send('Invalid email');
        return;
    }

    const existingUser = await userRepository.findOne({email: userData.email});
    if(existingUser) {
        res.status(400).send('Email in use');
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
            res.status(500).send(error);
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

        try { 
            const mailRes = await sendConfirmationEmail(user);
            if(!mailRes) {
                res.status(500).send('Something went wrong with the email');
                return;
            }
        } catch (err) {
            res.status(500).send(err);
            return;
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

// Testing purposes only
export const createAdminUser = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);

    const userData = req.body;
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(userData.password, salt);
    userData.password = password;
    userData.uuid = uuidv4();
    userData.confirmed = false;
    userData.role = Role.Organizer;
    userData.email = userData.email?.toLowerCase();
    
    // Validate the email
    if(!EMAIL_REGEX.test(userData.email)) {
        res.status(400).send('Invalid email');
        return;
    }

    const existingUser = await userRepository.findOne({email: userData.email});
    if(existingUser) {
        res.status(400).send('Email in use');
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
            const emailRes = await sendConfirmationEmail(newUser);
            res.status(201).send({uuid: newUser.uuid, accessToken: accessToken, refreshToken: refreshToken});
        } catch (error) {
            res.status(500).send(error);
        }
    }
}

export const checkIn = async (req: Request, res: Response): Promise<void> => {
    const userRepo = getManager().getRepository(User);
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

    if(!user.discordId) {
        res.status(400).send('User is not linked with Discord.');
    } else {
        user.checkedIn = true;
        await userRepo.save(user);
        const response = await assignDiscordRole(user.discordId);
        if(response) {
            res.status(response.status).send(response.data);
        } else {
            res.sendStatus(500);
        }
    }
};
