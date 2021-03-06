import {Team} from '../entity/Team';
import {getManager} from 'typeorm';
import {validate} from 'class-validator';
import {Request, Response} from 'express';
import { nanoid } from 'nanoid';
import * as auth from '../middleware/authMiddleware';
import {User} from '../entity/User';
import {TeamInvite} from '../entity/TeamInvite';

const MAX_TEAM_SIZE = 4;

// A team is created with one user and a name
export const createTeam = async (req: Request, res: Response): Promise<void> => {
    const teamRepository = getManager().getRepository(Team);

    const teamData = req.body;

    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    if(user.team) {
        res.status(400).send('This user is already on a team.');
        return;
    }

    delete user.team;
    teamData.members = [user];
    teamData.uuid = nanoid(8);

    const newTeam = teamRepository.create({...teamData} as Team); // This makes TypeORM not return an array...

    const errors = await validate(newTeam);
    if(errors.length > 0) {
        res.sendStatus(400);
    } else {
        try {
            await teamRepository.save(newTeam);
            res.status(201).send({uuid: newTeam.uuid});
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export const getMyTeam = async (req: Request, res: Response): Promise<void> => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    const team = user.team;
    
    if(team){
        res.status(200).send(team);
    } else {
        res.sendStatus(404);
    }
}

export const getTeam = async (req: Request, res: Response): Promise<void> => {
    const teamRepository = getManager().getRepository(Team);
    const team = await teamRepository.findOne({uuid: req.params.teamId}, {relations: ['members']});
    if(team){
        res.status(200).send(team);
    } else {
        res.sendStatus(404);
    }
}

export const getTeams = async (req: Request, res: Response): Promise<void> => {
    const teamRepository = getManager().getRepository(Team);
    const teams = await teamRepository.find({relations: ['members']});
    res.status(200).send(teams);
}

export const changeName = async (req: Request, res: Response): Promise<void> => {
    const teamRepository = getManager().getRepository(Team);

    const teamId = req.params.teamId;
    const newName = req.body.name;

    if(!newName) {
        res.sendStatus(400);
        return;
    }

    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    if(!user.team || user.team.uuid !== teamId) {
        res.status(403).send('You can only change your own team\'s name.');
    }
    
    const team = await teamRepository.findOne({uuid: teamId});

    if(team){
        team.name = newName;
        await teamRepository.save(team);
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
    

}

export const joinTeam = async (req: Request, res: Response): Promise<void> => {
    const teamRepository = getManager().getRepository(Team);
    const inviteRepo = getManager().getRepository(TeamInvite);

    const inviteId = req.body.inviteId;
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team', 'teamInvites']);
    if(!user) {
        res.sendStatus(401);
        return;
    }
    
    if(user.team) {
       res.status(400).send('This user is already on a team.');
       return;
    }

    const invite = user.teamInvites?.find(inv => inv.uuid === inviteId);
    if(!invite) {
        res.status(403).send('You are not invited to this team.');
        return;
    }

    const inviteObj = await inviteRepo.findOne({id: invite.id}, {relations: ['team']});
    const team = inviteObj?.team;
    if(!team){
        res.status(404).send('That team does not exist.');
        return;
    }

    if(team.members && team.members.length >= MAX_TEAM_SIZE) {
        res.status(400).send('That team is full.');
        return;
    }
    
    delete user.team;
    if(team.members){
        team.members.push(user);
    } else {
        team.members = [user];
    }
    
    await inviteRepo.remove(invite);
    await teamRepository.save(team);
    res.sendStatus(200);
}

export const leaveTeam = async (req: Request, res: Response): Promise<void> => {
    const teamRepository = getManager().getRepository(Team);

    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    if(!user.team) {
       res.status(400).send('This user is not on a team.');
       return;
    }

    const team = await teamRepository.findOne({uuid: user.team.uuid});

    if(!team){
        res.status(404).send('That team does not exist???');
        return;
    }

    // Remove the user
    team.members.forEach((item, index) => {
        if(item.uuid == user.uuid) team.members.splice(index, 1);
    });

    await teamRepository.save(team);

    res.sendStatus(200);
}


// Takes email or discord username
export const createInvite = async (req: Request, res: Response): Promise<void> => {
    const invitesRepo = getManager().getRepository(TeamInvite);
    const userRepo = getManager().getRepository(User);

    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    const team = user.team;

    if(!team) {
        res.status(400).send('User is not on a team.');
        return;
    }

    const username = req.body.username;

    if(!username) {
        res.sendStatus(400);
        return;
    }

    let invitedUser;
    if(username.includes("@") && username.includes(".")) {
        invitedUser = await userRepo.findOne({email: username});
    } else {
        invitedUser = await userRepo.findOne({discordUsername: username});
    }
    
    if(!invitedUser) {
        res.status(404).send('User not found.');
        return;
    }

    const newInvite = invitesRepo.create({
        uuid: nanoid(8),
        team: team,
        user: invitedUser
    });
    
    await invitesRepo.save(newInvite);
    res.status(200).send({uuid: newInvite.uuid});
}

export const revokeInvite = async (req: Request, res: Response): Promise<void> => {
    const inviteRepo = getManager().getRepository(TeamInvite);    
    const inviteId = req.params.inviteId;

    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    const inviteToRemove = await inviteRepo.findOne({uuid: inviteId}, {relations: ['team']});
    if(!inviteToRemove) {
        res.sendStatus(404);
        return;
    }

    if(inviteToRemove.team.uuid !== user.team?.uuid) {
        res.sendStatus(403);
        return;
    }

    await inviteRepo.remove(inviteToRemove);
    res.sendStatus(204);
}

export const getInvitesForUser = async (req: Request, res: Response): Promise<void> => {
    const inviteRepo = getManager().getRepository(TeamInvite);
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['teamInvites']);
    if(!user) {
        res.sendStatus(401);
        return;
    }
    
    const invites = await inviteRepo
                    .createQueryBuilder('invite')
                    .leftJoinAndSelect('invite.team', 'team', 'team.id = invite.teamId')
                    .leftJoinAndSelect('invite.user', 'user', 'user.id = invite.userId')
                    .leftJoinAndSelect('user.application', 'application', 'user.applicationId = application.id')
                    .where('user.id = :userId', {userId: user.id})
                    .getMany();

    const output = [];
    for(let invite of invites) {
        output.push({
            uuid: invite.uuid,
            firstName: invite.user?.application?.firstName,
            lastName: invite.user?.application?.lastName,
            discordUsername: invite.user?.discordUsername,
            teamId: invite.team?.uuid,
            teamName: invite.team?.name 
        });
    }

    if(output) {
        res.status(200).send(output);
    } else {
        res.sendStatus(404);
    }
}

export const getInvitesForTeam = async (req: Request, res: Response): Promise<void> => {
    const teamId = req.params.teamId;
    const teamRepo = getManager().getRepository(Team);
    const invitesRepo = getManager().getRepository(TeamInvite);
    
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['team']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    if(teamId !== user.team?.uuid) {
        res.sendStatus(403);
        return;
    }

    const invites = await invitesRepo
                    .createQueryBuilder('invite')
                    .leftJoinAndSelect('invite.team', 'team', 'team.id = invite.teamId')
                    .leftJoinAndSelect('invite.user', 'user', 'user.id = invite.userId')
                    .leftJoinAndSelect('user.application', 'application', 'user.applicationId = application.id')
                    .where('team.uuid = :teamId', {teamId: teamId})
                    .getMany();

    const output = [];
    for(let invite of invites) {
        output.push({
            uuid: invite.uuid,
            firstName: invite.user?.application?.firstName,
            lastName: invite.user?.application?.lastName,
            discordUsername: invite.user?.discordUsername,
            teamId: invite.team?.uuid,
            teamName: invite.team?.name
        });
    }

    if(!output) {
        res.sendStatus(404);
    } else {
        res.status(200).send(output);
    }

}