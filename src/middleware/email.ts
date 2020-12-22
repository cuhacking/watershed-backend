import axios, { AxiosRequestConfig } from 'axios';
import mailgun from 'mailgun-js';
import { promises as fs } from 'fs';

const FROM_EMAIL = process.env.FROM_EMAIL;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;

const interpolate = (str: string) => {
    return (props: any) => {
        return str.replace(/\{(\w+)\}/g, (match, expr) => {
            return (props)[expr];
        });
    }
};

export const createEmailTemplate = async (filename: string) => {
    try {
        const html = await fs.readFile(filename, 'utf-8');
        return interpolate(html);
    } catch (err) {
        return undefined;
    } 
}

export const sendEmail = async (recipient: string, subject: string, body: string): Promise<boolean> => {

    if(!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
        return false;
    }

    const mg = mailgun({apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN});
    const data = {
        from: FROM_EMAIL,
        to: recipient,
        subject: subject,
        text: body,
    };

    try {
        await mg.messages().send(data);
        return true;
    } catch(err) {
        console.log(err);
        return false;
    }
}