import * as auth from '../middleware/authMiddleware';
import {User} from '../entity/User';
import {Application} from '../entity/Application';

import {getManager} from 'typeorm';
import {Request, Response} from 'express';
import {validate} from 'class-validator';
import app from '../server';

import * as path from 'path';
import * as fs from 'fs';

// Default to a resumes directory in the root of the project
const RESUME_ROOT = process.env.RESUME_DIR || __dirname + '/../../resumes/';

const isApplicationComplete = (app: Application): app is Required<Application> => {
    return Object.values(app as Required<Application>).every(val => val !== null);
}

export const saveApplication = async (req: Request, res: Response) => {
    const appRepo = getManager().getRepository(Application);

    // Grab currently logged in user
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401); // User was not properly authenticated...
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['application']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    if(user.application?.completed) {
        res.status(400).send('User already has a completed application.');
        return;
    }
    
    const existingApp = user.application;
    let appData = null;
    if(req.body.body) {
        appData = JSON.parse(req.body.body);
    }

    // If there's an existing one, update the fields. Otherwise, create a new one
    let appToSave;
    if(existingApp) {
        appToSave = Object.assign(existingApp, appData);
    } else {
        appToSave = appRepo.create({...appData as Application});
    }
    
    // Handle the resume. We're saving them to a resumes folder in the root of the project
    if(req.files?.resume) {        
        let resume = req.files.resume;
        try {
            const resumePath = await fs.promises.realpath(RESUME_ROOT) + '/' + appToSave.id + '.pdf';
            await resume.mv(resumePath);
            appToSave.resumePath = resumePath;
            appToSave.resumeName = req.files.resume.name;
        } catch (err) { 
            res.status(500).send(err);
            return;
        }
    }

    let userToSave = user;
    delete userToSave.application; // We need to delete the app so we don't write a null application
    appToSave.user = userToSave
    if(!appToSave.completed) {
        appToSave.completed = false;
    }

    console.log(appToSave);

    if(appToSave.completed) {
        // Validate that the application is completed if they are saving
        if(!isApplicationComplete(appToSave)){
            res.status(400).send('Application is missing fields.');
            return;
        }
    }

    const errors = await validate(appToSave);
    if(errors.length > 0) {
        res.sendStatus(400);
    } else {
        try {
            await appRepo.save(appToSave);
            res.sendStatus(201);
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export const getApplicationForUser = async (req: Request, res: Response) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        res.sendStatus(401);
        return;
    }

    const user = await auth.getUserObjectFromToken(token, ['application']);
    if(!user) {
        res.sendStatus(401);
        return;
    }

    if(user.application) {
        // Remove the id and resume path
        let {id, resumePath, ...app} = user.application;
        res.status(200).send(app);
    } else {
        res.sendStatus(404);
    }
}

export const getApplicationByUserId = async (req: Request, res: Response) => {
    const userRepo = getManager().getRepository(User);
    const user = await userRepo.findOne({uuid: req.params.userId});

    if(!user) {
        res.sendStatus(404);
        return;
    }

    if(user.application) {
        // Remove the id and resume path
        let {id, resumePath, ...app} = user.application;
        res.status(200).send(app);
    } else {
        res.sendStatus(404);
    }
}

export const getAllApplications = async (req: Request, res: Response) => {
    const appRepo = getManager().getRepository(Application);
    const applications = await appRepo.find();
    res.status(200).send(applications);
}