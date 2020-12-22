import * as auth from '../middleware/authMiddleware';
import {User} from '../entity/User';
import {AccessToken} from '../entity/AccessToken';
import {RefreshToken} from '../entity/RefreshToken';
import {getManager} from 'typeorm';
import {Request, Response} from 'express';
import * as bcrypt from 'bcrypt';
import { PasswordReset } from '../entity/PasswordReset';

// Logs in a user - see /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne({email: req.body.email});
    if(user && user.password){
        const match = await bcrypt.compare(req.body.password, user.password);
        if(match) {
            // Generate a new access token and refresh token for them
            const accessToken = await auth.generateToken(user.uuid, 'access');
            const refreshToken = await auth.generateToken(user.uuid, 'refresh');
            res.status(200).send({uuid: user.uuid, accessToken: accessToken, refreshToken: refreshToken});
        } else {
            res.sendStatus(401);
        }
    } else {
        // User with that email doesn't exist, or they are not an email/password user - don't tell them that though for security...
        res.sendStatus(401);
    }
}

// Exchange a refresh token for a new access token - see /auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
    const checkResult = await auth.verifyToken(req.body.token, 'refresh');
    if(checkResult.result === auth.AuthTokenStatus.Valid && checkResult.uid) {
        const accessToken = await auth.generateToken(checkResult.uid, 'access');
        res.status(200).send({accessToken: accessToken});
    } else {
        res.status(401).send('Invalid refresh token');
    }
}

// Handles a password reset request. Responsible for taking their email and sending the reset email - see /auth/reset
export const resetRequest = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne({email: req.body.email});

    if(user) {
        const token = await auth.generateToken(user.uuid, 'reset');
        // TODO: Send email here
        res.sendStatus(200);
    } else {
        // Don't want to leak whether a user exists with that email - make it look it might have succeeded
        await new Promise(resolve => setTimeout(resolve, (Math.random()*1000) + 1500));
        res.sendStatus(200);
    }
}

// Do the actual password reset. Also invalidates all of their previous tokens. - see /auth/performReset
export const performReset = async (req: Request, res: Response): Promise<void> => {
    const checkResult = await auth.verifyToken(req.body.token, 'reset');
    if(checkResult.result === auth.AuthTokenStatus.Valid && checkResult.uid) {
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.password, salt);
        const userRepository = getManager().getRepository(User);
        const user = await userRepository.findOne({uuid: checkResult.uid});
        if(user) {
            // Invalidate their old access, refresh and reset tokens 
            const accessTokenRepo = getManager().getRepository(AccessToken);
            const refreshTokenRepo = getManager().getRepository(RefreshToken);
            const resetTokenRepo = getManager().getRepository(PasswordReset);

            const userAccessTokens = await accessTokenRepo.find({uuid: user.uuid});
            userAccessTokens.forEach((element: AccessToken) => {
                accessTokenRepo.remove(element);
            });

            const userRefreshTokens = await refreshTokenRepo.find({uuid: user.uuid});
            userRefreshTokens.forEach((element: RefreshToken) => {
                refreshTokenRepo.remove(element);
            });

            const userResetTokens = await resetTokenRepo.find({uuid: user.uuid});
            userResetTokens.forEach((element: PasswordReset) => {
                resetTokenRepo.remove(element);
            });

            user.password = password;
            await userRepository.save(user);
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } else {
        res.status(400).send('Invalid token');
    }
}

// Logs out a user (i.e. invalidates all of their access and refresh tokens) - see /auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const userId = auth.getUserFromToken(token);
    if(!userId) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const refreshToken = req.body.refreshToken;
    const refreshTokenRepo = getManager().getRepository(RefreshToken);

    const userRefreshToken = await refreshTokenRepo.findOne({uuid: userId, token: refreshToken});
    
    if(userRefreshToken) {
        refreshTokenRepo.remove(userRefreshToken);
    }

    res.sendStatus(200);
}

// Logs out a user (i.e. invalidates all of their access and refresh tokens) - see /auth/logout
export const invalidateTokens = async (req: Request, res: Response): Promise<void> => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const userId = auth.getUserFromToken(token);
    if(!userId) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    // Invalidate their access and refresh tokens 
    const accessTokenRepo = getManager().getRepository(AccessToken);
    const refreshTokenRepo = getManager().getRepository(RefreshToken);

    const userAccessTokens = await accessTokenRepo.find({uuid: userId});
    userAccessTokens.forEach((element: AccessToken) => {
        accessTokenRepo.remove(element);
    });

    const userRefreshTokens = await refreshTokenRepo.find({uuid: userId});
    userRefreshTokens.forEach((element: RefreshToken) => {
        refreshTokenRepo.remove(element);
    });
    res.sendStatus(200);
}