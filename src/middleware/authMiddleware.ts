import { encode, decode, TAlgorithm } from 'jwt-simple';
import {Request, Response, NextFunction} from 'express';
import {AccessToken} from '../entity/AccessToken';
import {RefreshToken} from '../entity/RefreshToken';
import {PasswordReset} from '../entity/PasswordReset';
import {getManager} from 'typeorm';
import { User, Role } from '../entity/User';

const SECRET_KEY = process.env.JWT_KEY ?? ''; // This must be defined, or server.ts will kill the application 
const ACCESS_EXPIRY = 30 * 60 * 1000; // 30 minutes
const RESET_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Ref https://nozzlegear.com/blog/implementing-a-jwt-auth-system-with-typescript-and-node

interface Session {
    id: string,
    issueDate: number,
    expiryDate: number | undefined;
}

interface EncodeResult {
    token: string,
    issueDate: number,
    expiryDate: number | undefined;
}

interface DecodeResult {
    valid: boolean,
    session?: Session,
    error?: string
}

export enum AuthTokenStatus {
    Invalid,
    Expired,
    Valid
}

export interface VerifyResult {
    result: AuthTokenStatus,
    uid: string | undefined;
}

type TokenType = 'access' | 'refresh' | 'reset';

/**
 * Generates a JWT to be used as a token
 * 
 * @param uid the uuid of the user
 * @param type the type of the token - access, refresh, or reset
 * 
 * @returns an Encode Result object containing the token, issue date and expiry date
 */
export const encodeJWT = (uid: string, type: TokenType): EncodeResult => {
    const algorithm: TAlgorithm = 'HS512';
    const issueDate = Date.now();
    let expiryDate;

    if(type === 'access') {
        expiryDate = Date.now() + ACCESS_EXPIRY;
    } else if(type === 'reset') {
        expiryDate = Date.now() + RESET_EXPIRY;
    } else {
        expiryDate = undefined; // Never expire
    }
    
    const session: Session = {
        id: uid,
        issueDate: issueDate,
        expiryDate: expiryDate
    };
    return {
        token: encode(session, SECRET_KEY, algorithm),
        issueDate: issueDate,
        expiryDate: expiryDate
    };
};

/**
 * Decodes a given token and checks if it is valid
 * 
 * @param token the JWT to decode
 * 
 * @returns DecodeResult object containing: Whether the JWT is valid and the session (if it was valid) or an error message (if invalid)
 */
export const decodeJWT = (token: string): DecodeResult => {
    const algorithm: TAlgorithm = 'HS512';
    try {
        const decoded = decode(token, SECRET_KEY, false, algorithm);
        return {
            valid: true,
            session: decoded
        };
    } catch (e) {
        return {
            valid: false,
            error: e.message
        };
    }
};

/**
 * Handles the creation and management of new tokens. Generates a JWT, and saves it to the appropriate table
 * 
 * @param uid the uid of the user
 * @param type the type of the token - access, refresh, or reset
 * 
 * @returns the EncodeResult returned by encodeJWT()
 */
export const generateToken = async (uid: string, type: TokenType): Promise<EncodeResult> => {
    const result: EncodeResult = encodeJWT(uid, type);
    if(type === 'access') {
        const accessTokenRepo = getManager().getRepository(AccessToken);
        await accessTokenRepo.save(accessTokenRepo.create({token: result.token, uuid: uid}));
    } else if(type === 'refresh') {
        const refreshTokenRepo = getManager().getRepository(RefreshToken);
        await refreshTokenRepo.save(refreshTokenRepo.create({token: result.token, uuid: uid}));
    } else if(type === 'reset') {
        const resetRepo = getManager().getRepository(PasswordReset);
        await resetRepo.save(resetRepo.create({token: result.token, uuid: uid}));
    }
    
    return result;
}

/**
 * Verifies if a token a valid or not
 * 
 * @param token the token
 * @param type the expected type of the token
 * 
 * @returns VerifyResult object, with result of the decoding and the uid of the token owner if the token was valid
 */
export const verifyToken = async (token: string, type: TokenType): Promise<VerifyResult> => {
    const session: DecodeResult = decodeJWT(token);
    if(!session.valid) {
        return {
            result: AuthTokenStatus.Invalid, 
            uid: undefined
        };
    }

    const tokenInfo = session.session;
    if(tokenInfo?.expiryDate && tokenInfo.expiryDate < Date.now()) {
        return {
            result: AuthTokenStatus.Expired,
            uid: undefined
        }
    }

    if(type === 'access') {
        const accessTokenRepo = getManager().getRepository(AccessToken);
        const savedToken = await accessTokenRepo.findOne({token: token});
        if(!savedToken) {
            return {
                result: AuthTokenStatus.Invalid, 
                uid: undefined
            }
        }
    } else if(type === 'refresh') {
        const refreshTokenRepo = getManager().getRepository(RefreshToken);
        const savedToken = await refreshTokenRepo.findOne({token: token});
        if(!savedToken) {
            return {
                result: AuthTokenStatus.Invalid, 
                uid: undefined
            }
        }
    } else if(type === 'reset') {
        const resetRepo = getManager().getRepository(PasswordReset);
        const savedToken = await resetRepo.findOne({token: token});
        if(!savedToken) {
            return {
                result: AuthTokenStatus.Invalid, 
                uid: undefined
            }
        }
    }

    return {
        result: AuthTokenStatus.Valid,
        uid: session.session?.id
    }
}

export const getUserFromToken = (token: string): string|undefined => {
    return decodeJWT(token).session?.id;
}

// Middleware for verifying if a request is authenticated via a Bearer token in Authentication header
export const authenticate = (role: Role): (req: Request, res: Response, next: NextFunction) => Promise<void> => {

    return async (req: Request, res: Response, next: NextFunction) => {
        const header = req.header('Authorization')?.split(' ')[1];
        if(!header) {
            res.status(401).send('Authorization header not provided');
        } else {
            const verify = await verifyToken(header, 'access');
            if(verify.result === AuthTokenStatus.Invalid) {
                res.status(401).send('Invalid token');
            } else if(verify.result === AuthTokenStatus.Expired){
                res.status(401).send('Token expired');
            } else {
                const userRepo = getManager().getRepository(User);
                const user = await userRepo.findOne({uuid: verify.uid});
                if(user?.role && user.role >= role) {
                    next();
                } else {
                    res.sendStatus(403);
                }
            }
        }
    }
};