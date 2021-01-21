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

const githubAuth = new ClientOAuth2({
    clientId: process.env.githubClientId,
    clientSecret: process.env.githubClientSecret,
    accessTokenUri: 'https://github.com/login/oauth/access_token',
    authorizationUri: 'https://github.com/login/oauth/authorize',
    scopes: ['user']
});

const HOSTNAME = process.env.EXTERNAL_HOSTNAME || '';
const AFTER_LOGIN_REDIRECT = process.env.AFTER_LOGIN_REDIRECT || HOSTNAME;

export const authGithub = async (req: Request, res: Response): Promise<void> => {
    const state = crypto.randomBytes(16).toString('hex');

    const stateRepo = getManager().getRepository(State);
    await stateRepo.save(stateRepo.create({state: state, type: 'github'}));

    res.redirect(githubAuth.code.getUri({redirectUri: HOSTNAME + '/api/auth/github/callback/signin', state: state}));
}

export const linkGithub = async (req: Request, res: Response): Promise<void> => {
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
    await stateRepo.save(stateRepo.create({state: state, type: 'github'}));

    res.redirect(githubAuth.code.getUri({redirectUri: HOSTNAME + '/api/auth/github/callback/link', state: state}));
}

export const githubAuthCallback = async (req: Request, res: Response): Promise<void> => {
    // Before we do anything, check that the state is valid
    const stateRepo = getManager().getRepository(State);

    if(!req.query.state) {
        res.sendStatus(400);
        return;
    }

    const state = req.query.state as string;
    const savedState = await stateRepo.findOne({state: state, type: 'github'});
    if(!savedState) {
        res.sendStatus(400);
        return;
    }
    await stateRepo.remove(savedState); // We don't need this state anymore

    const token = await githubAuth.code.getToken(req.originalUrl);
    const url = token.sign({method: 'get', url: 'https://api.github.com/user'}) as AxiosRequestConfig;
    const response = await axios(url);

    let email = response.data.email;
    const emailUrl = token.sign({method: 'get', url: 'https://api.github.com/user/emails'}) as AxiosRequestConfig;
    const emailResponse = await axios(emailUrl);

    if(!email) {
        for(const possibleEmail of emailResponse.data) {
            if(possibleEmail.primary) {
                email = possibleEmail.email;
                break;
            }
        }
    
        if(!email) {
            email = response.data[0].email; // No primary, default to the first one (not sure if this is even possible)
        }
    }
    
    const userRepo = getManager().getRepository(User);
   
    const githubUser = await userRepo.findOne({githubId: response.data.id});
    if(githubUser) {
        const hasCorrectEmail = emailResponse.data.some((emailObject: any) => emailObject.email.toLowerCase() === githubUser.email.toLowerCase()); // Check if it matches any of the GitHub user's emails
        if(hasCorrectEmail) {
            // User with this ID exists, log them in
            // Generate a new access token and refresh token for them
            const accessToken = await auth.generateToken(githubUser.uuid, 'access');
            const refreshToken = await auth.generateToken(githubUser.uuid, 'refresh');
            res.cookie('refreshToken', refreshToken.token, {secure: true});
            res.cookie('accessToken', accessToken.token, {secure: true});
            res.redirect(AFTER_LOGIN_REDIRECT);
        } else {
            res.status(400).send('This GitHub account is already linked to an account. Please log in with that account.');
        }
        
    } else {
        // No one has that GitHub ID, must be signing up
        const existingUser = await userRepo.createQueryBuilder()
                                            .where('LOWER(email) = LOWER(:email)', { email: email })
                                            .getOne();
        if(existingUser) {
            res.status(400).send('A user with that email already exists. Please log in with the method used to sign up, and link your GitHub account in the settings.');
        } else {
            const newUser = userRepo.create({
                uuid: uuidv4(),
                role: Role.Hacker,
                email: email,
                githubId: response.data.id,
                confirmed: true
            } as User);

            const errors = await validate(newUser);
            if(errors.length > 0) {
                console.log(errors);
                res.sendStatus(400);
            } else {
                try {
                    await userRepo.save(newUser);
                    // Login the new user
                    const accessToken = await auth.generateToken(newUser.uuid, 'access');
                    const refreshToken = await auth.generateToken(newUser.uuid, 'refresh');
                    res.cookie('refreshToken', refreshToken.token, {secure: true});
                    res.cookie('accessToken', accessToken.token, {secure: true});
                    res.redirect(AFTER_LOGIN_REDIRECT);
                } catch (error) {
                    res.status(400).send(error);
                }
            }
        }
    }
}

export const githubLinkCallback = async (req: Request, res: Response): Promise<void> => {
    // Before we do anything, check that the state is valid
    const state = req.query.state as string | undefined;
    const stateRepo = getManager().getRepository(State);
    const savedState = await stateRepo.findOne({state: state, type: 'github'});

    if(!savedState) {
        res.sendStatus(400);
        return;
    }
    await stateRepo.remove(savedState); // We don't need this state anymore
    
    const token = await githubAuth.code.getToken(req.originalUrl);
    const url = token.sign({method: 'get', url: 'https://api.github.com/user'}) as AxiosRequestConfig;
    const response = await axios(url);

    const userRepo = getManager().getRepository(User);
    const userUuid = state?.split('/')[1];

    if(!userUuid) {
        res.status(400).send('Invalid state.'); // The state is wrong...
    } else {
        const existingGithubUser = await userRepo.findOne({githubId: response.data.id});
        if(existingGithubUser){
            res.status(400).send('This GitHub account is already linked to an account. Please log in with that account.');
            return;
        }

        const user = await userRepo.findOne({uuid: userUuid});
        if(!user) {
            res.sendStatus(400); // Can this even happen???
        } else {
            if(user.githubId) {
                res.status(400).send('This user already has a GitHub account linked. Please unlink first, then try again.');
            } else {
                user.githubId = response.data.id;
                await userRepo.save(user);
                res.sendStatus(200);
            }
            
        }
    }
}

export const unlinkGithub = async (req: Request, res: Response): Promise<void> => {
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
        user.githubId = null; 
        await userRepo.save(user);
        res.sendStatus(204);
    } else {
        res.sendStatus(401);
    }
}