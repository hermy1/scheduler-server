import * as nodemailer from "nodemailer";
import { SentMessageInfo } from 'nodemailer';
import config from '..';

let mailInstance: SentMessageInfo;

export const getMailer = async (): Promise<SentMessageInfo> => {
    if (!mailInstance) {

        mailInstance = nodemailer.createTransport({
            host: config.mail.host,
            port: config.mail.port,
            secure: true,
            ignoreTLS: true,
            auth: {
                user: config.mail.user,
                pass: config.mail.pass
            }
        });

        //logger.log({ level: "debug", message: `Node Mailer was initialized` });
        console.log('node mailer initialized');
    }

    return mailInstance;
}