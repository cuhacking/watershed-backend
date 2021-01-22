import {User} from '../entity/User';
import {Application} from '../entity/Application';
import * as auth from '../middleware/authMiddleware';
import {getManager} from 'typeorm';
import {Request, Response} from 'express';

export const getStats = async (req: Request, res: Response): Promise<void> => {
    const userRepo = getManager().getRepository(User);
    const appRepo = getManager().getRepository(Application);

    const userCount = await userRepo
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .getRawOne();

    const appCount = await appRepo
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .getRawOne();

    const numCountries = await appRepo 
        .createQueryBuilder()
        .select('COUNT(DISTINCT country)', 'count')
        .getRawOne();

    const numSchools = await appRepo 
        .createQueryBuilder()
        .select('COUNT(DISTINCT school)', 'count')
        .getRawOne();

    const linkedDiscord = await userRepo
        .createQueryBuilder('user')
        .select('COUNT(DISTINCT user.discordId)', 'count')
        .getRawOne();

    res.status(200).send({
        users: userCount,
        applications: appCount,
        countries: numCountries,
        schools: numSchools,
        usersLinkedWithDiscord: linkedDiscord
    });
}   