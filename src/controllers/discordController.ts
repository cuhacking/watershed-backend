import ClientOAuth2 from 'client-oauth2';
import {Request, Response} from 'express';
import axios, { AxiosRequestConfig, AxiosPromise } from 'axios';
import {User, Role} from '../entity/User';
import {getManager} from 'typeorm';
import * as auth from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import {validate} from 'class-validator';
import * as crypto from 'crypto';
import {State} from '../entity/State';

const discordAuth = new ClientOAuth2({
    clientId: process.env.discordClientId,
    clientSecret: process.env.discordClientSecret,
    accessTokenUri: 'https://discord.com/api/oauth2/token',
    authorizationUri: 'https://discord.com/api/oauth2/authorize',
    scopes: ['identify', 'email']
});

const HOSTNAME = process.env.EXTERNAL_HOSTNAME || '';
const AFTER_LOGIN_REDIRECT = process.env.AFTER_LOGIN_REDIRECT || HOSTNAME;

export const authDiscord = async (req: Request, res: Response): Promise<void> => {
    const state = crypto.randomBytes(16).toString('hex');

    const stateRepo = getManager().getRepository(State);
    await stateRepo.save(stateRepo.create({state: state, type: 'discord'}));

    res.redirect(discordAuth.code.getUri({redirectUri: HOSTNAME + '/api/auth/discord/callback/signin', state: state}));
}

export const linkDiscord = async (req: Request, res: Response): Promise<void> => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const uuid = auth.getUserFromToken(token);
    if(!uuid) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const state = crypto.randomBytes(16).toString('hex') + '/' + uuid

    const stateRepo = getManager().getRepository(State);
    await stateRepo.save(stateRepo.create({state: state, type: 'discord'}));

    res.redirect(discordAuth.code.getUri({redirectUri: HOSTNAME + '/api/auth/discord/callback/link', state: state}));
}

export const discordAuthCallback = async (req: Request, res: Response): Promise<void> => {
    // Before we do anything, check that the state is valid
    const stateRepo = getManager().getRepository(State);
    const state = req.query.state as string | undefined;
    const savedState = await stateRepo.findOne({state: state, type: 'discord'});
    if(!savedState) {
        res.status(400).send('Bad state');
        return;
    }
    await stateRepo.remove(savedState); // We don't need this state anymore

    // For some reason Discord needs a redirectUri here
    const user = await discordAuth.code.getToken(req.originalUrl, {redirectUri: HOSTNAME + '/api/auth/discord/callback/signin'});

    const url = user.sign({method: 'get', url: 'https://discord.com/api/users/@me'}) as AxiosRequestConfig;
    const response = await axios(url);

    const userRepo = getManager().getRepository(User);

    const discordUser = await userRepo.findOne({email: response.data.email, discordId: response.data.id});
    if(discordUser) {
        // User with this ID exists, log them in
        // Generate a new access token and refresh token for them
        const accessToken = await auth.generateToken(discordUser.uuid, 'access');
        const refreshToken = await auth.generateToken(discordUser.uuid, 'refresh');
        res.cookie('refreshToken', refreshToken, {secure: true});
        res.cookie('accessToken', accessToken, {secure: true});
        res.redirect(AFTER_LOGIN_REDIRECT);
    } else {
        // No one has that discord ID, must be signing up
        const existingUser = await userRepo.findOne({email: response.data.email});
        const existingdiscordUser = await userRepo.findOne({discordId: response.data.id});
        if(existingUser) {
            res.status(400).send('A user with that email already exists. Please log in with the method used to sign up, and link your Discord account in the settings.');
        } else if(existingdiscordUser) {
            res.status(400).send('This Discord account is already linked to an account. Please log in with that account.');
        } else {
            const newUser = userRepo.create({
                uuid: uuidv4(),
                role: Role.Hacker,
                email: response.data.email,
                discordId: response.data.id,
                confirmed: true // OAuth users automatically have a confirmed email (do we want this?)
            } as User);

            const errors = await validate(newUser);
            if(errors.length > 0) {
                res.status(400).send(errors);
            } else {
                try {
                    await userRepo.save(newUser);
                    // Login the new user
                    const accessToken = await auth.generateToken(newUser.uuid, 'access');
                    const refreshToken = await auth.generateToken(newUser.uuid, 'refresh');
                    res.cookie('refreshToken', refreshToken, {secure: true});
                    res.cookie('accessToken', accessToken, {secure: true});
                    res.redirect(AFTER_LOGIN_REDIRECT);
                } catch (error) {
                    // TODO: Does this need to be handled as a redirect?
                    res.status(400).send(error);
                }
            }
        }
    }
}

export const discordLinkCallback = async (req: Request, res: Response): Promise<void> => {
    // Before we do anything, check that the state is valid
    if(!req.query.state) {
        res.status(400).send('No state');
        return;
    }
    const state = req.query.state as string;
    const stateRepo = getManager().getRepository(State);
    const savedState = await stateRepo.findOne({state: state, type: 'discord'});

    if(!savedState) {
        res.status(400).send('Bad state');
        return;
    }
    await stateRepo.remove(savedState); // We don't need this state anymore
    
    // For some reason Discord needs a redirectUri here
    const discordUser = await discordAuth.code.getToken(req.originalUrl, {redirectUri: HOSTNAME + '/api/auth/discord/callback/link'});
    const url = discordUser.sign({method: 'get', url: 'https://discord.com/api/users/@me'}) as AxiosRequestConfig;
    const response = await axios(url);

    const userRepo = getManager().getRepository(User);
    const userUuid = state?.split('/')[1];

    if(!userUuid) {
        res.status(400).send('Invalid state.'); // The state is wrong...
    } else {
        const existingdiscordUser = await userRepo.findOne({discordId: response.data.id});
        if(existingdiscordUser){
            res.status(400).send('This Discord account is already linked to an account. Please log in with that account.');
            return;
        }

        const user = await userRepo.findOne({uuid: userUuid});
        if(!user) {
            res.sendStatus(400); // Can this even happen???
        } else {
            if(user.discordId) {
                res.status(400).send('This user already has a Discord account linked. Please unlink first, then try again.'); // Do we want this?
            } else {
                user.discordId = response.data.id;
                await userRepo.save(user);
                res.sendStatus(200);
            }
            
        }
    }
}

export const unlinkDiscord = async (req: Request, res: Response): Promise<void> => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const uuid = auth.getUserFromToken(token);
    if(!uuid) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const userRepo = getManager().getRepository(User);
    const user = await userRepo.findOne({uuid: uuid});
    if(user) { 
        user.discordId = null; 
        await userRepo.save(user);
        res.sendStatus(204);
    } else {
        res.sendStatus(401);
    }
}