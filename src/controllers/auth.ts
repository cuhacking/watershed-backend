import * as auth from '../middleware/auth';
import {User} from '../entity/User';
import {getManager} from "typeorm";
import {Request, Response} from "express";
import * as bcrypt from "bcrypt";

export const login = async (req: Request, res: Response): Promise<void> => {
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne({email: req.body.email});
    if(user){
        const match = await bcrypt.compare(req.body.password, user.password);
        if(match) {
            const JWT = auth.encodeJWT(user.uuid);
            res.status(200).send(JWT);
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(404);
    }
}