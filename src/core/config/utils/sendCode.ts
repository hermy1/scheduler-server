import { createAuthCode, insertNewCode } from "../../../mongo/mutations/code";
import { checkExistingCode } from "../../../mongo/queries/code";
import config from "..";
import { getMailer } from "./mailHelper";

export const sendMailAuthCode = async (userId: string, email: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            var code: string = await createAuthCode();
            if (code) {
                var insertCodeToDatabase = await insertNewCode(userId, code);
                if (insertCodeToDatabase) { 
                
                    var text: string = "Your code is: {code}";
                    let message: string = text.replace("{code}", code);
                    if (text) { 
                        const mailer = await getMailer();
                        mailer.sendMail({
                            from: config.mail.sender,
                            to: email,
                            subject: config.mail.subject_text,
                            html: message
                        }, (err: any) => {
                            if (err) {
                                console.log('there was a problem sending code through email',err);
                                //logger.log({ level: "error", message: `There was a problem sending the code through email: ${email}` });
                                resolve(false);
                            } else {
                                resolve(true);
                            }
                        });
                        
                    }
                    else {
                        resolve(false);
                        console.log('no settings');
                        //logger.log({ level: "error", message: "Could not get CodeTextSetting from database" });
                    }
                }
                else {
                    resolve(false);
                    console.log('could not add code to database');
                    //logger.log({ level: "error", message: "Could not insert code into database" });
                }
            } else {
                resolve(false);
                console.log('no code made');
                //logger.log({ level: "error", message: "Could not create code" });
        }

        } catch (err: any) {
            console.log('no send email');
            //logger.log({ level: "error", message: `Could not send email`, err });
            reject(err);
        }
    });
};

export const resendMailAuthCode = async (userId: string, email: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let currentCode = await checkExistingCode(userId);
            if (currentCode) {
                var text: string = "Your code is: {code}";
                let message: string = text.replace("{code}", currentCode.code);
                if (text) {

                    const mailer = await getMailer();
                    mailer.sendMail({
                        from: config.mail.sender,
                        to: email,
                        subject: config.mail.subject_text,
                        html: message
                    }, (err: any) => {
                        if (err) {
                            //logger.log({ level: "error", message: `There was a problem sending the code through email: ${email}` });
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    });

                }

                else {
                    resolve(false);
                    //logger.log({ level: "error", message: "Could not get CodeTextSetting from database" });
                }
            }
             else {
                resolve(false);
                //logger.log({ level: "error", message: "Could not find existing code for user" });
            }

        } catch (err: any) {
           // logger.log({ level: "error", message: `Could not send text message`, err });
            reject(err);
        }
    });
};