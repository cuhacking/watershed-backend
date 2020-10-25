import express from 'express';
import { Request, Response } from 'express';
import {getConnection} from "typeorm";

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    const connection = getConnection();
    if(connection.isConnected) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

export = router;