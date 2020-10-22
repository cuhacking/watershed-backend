import { encode, decode, TAlgorithm } from "jwt-simple";
import {Request, Response, NextFunction} from "express";

const SECRET_KEY = "abc"; // Use env for prod

// Ref https://nozzlegear.com/blog/implementing-a-jwt-auth-system-with-typescript-and-node

interface Session {
    id: string,
    issueDate: number,
    expiryDate: number
}

interface EncodeResult {
    token: string,
    issueDate: number,
    expiryDate: number
}

interface DecodeResult {
    valid: boolean,
    session?: Session,
    error?: string
}

export const encodeJWT = (uid: string): EncodeResult => {
    const algorithm: TAlgorithm = "HS512";
    const issueDate = Date.now();
    const expiryDate = issueDate + 15 * 60 * 1000; // 15 minutes
    const session: Session= {
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

export const decodeJWT = (token: string): DecodeResult => {
    const algorithm: TAlgorithm = "HS512";
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

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.header('Authorization')?.split(' ')[1];
    if(!header) {
        res.status(401).send('Authorization header not provided');
    } else {
        const session : DecodeResult = decodeJWT(header);

        if(!session.valid) {
            res.status(401).send('Invalid token');
        }

        const token = session.session;
        if(token && token.expiryDate < Date.now()) {
            res.status(401).send('Token expired');
        }

        next();
    }
};