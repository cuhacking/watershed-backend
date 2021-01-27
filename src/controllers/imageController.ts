import {Request, Response} from 'express';
import { promises as fs } from 'fs';
import {resolve} from 'path';

const IMAGES_FOLDER = process.env.IMAGES_PATH || './images';

export const serveImage = async (req: Request, res: Response): Promise<void> => {
    const image = req.params.image;

    try {
        const splitPath = image.split('/');
        const imageName = IMAGES_FOLDER + '/' + splitPath[splitPath.length - 1];
        await fs.access(imageName);
        res.sendFile(resolve(imageName));
    } catch (e) {
        console.log(e);
        res.sendStatus(404);
    }

}