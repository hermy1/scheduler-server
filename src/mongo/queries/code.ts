import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { resendMailAuthCode, sendMailAuthCode } from "../../core/config/utils/sendCode";
import { MongoFindError, MongoInsertError } from "../../core/errors/mongo";
import { Code } from "../../models/code";
import { createAuthCode, insertNewCode } from "../mutations/code";

export const checkIfCodeExists = async (userId: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Code>('codes');
            const results = await collection.findOne({ userId: ensureObjectId(userId) });
            if (results) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const checkExistingCode = async (userId: string): Promise<Code> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Code>('codes');
            const results = await collection.findOne({ userId:ensureObjectId(userId) });
            if (results) {
                resolve(results);
            } else {
                reject(new MongoFindError(`Something went wrong while finding code for user: ${userId}`));
            }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const checkIfCodeExistsForUser = async (userId: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Code>('codes');
            const results = await collection.findOne({ userId:ensureObjectId(userId) });
            if (results) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const checkIfCodeMatches = async (userId: string, code: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Code>('codes');
            const results = await collection.findOne({ userId: ensureObjectId(userId), code:code });
            if (results) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const sendEmailAuthCode = async (userId: string, email: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            var code: string = await createAuthCode();
            if (code) {
                var insertCodeToDatabase = await insertNewCode(userId, code);
                if (insertCodeToDatabase) { 
                    let sendEmail = await sendMailAuthCode(userId, email);//send code by email
                    if (sendEmail){
                        resolve(true);         
                    } else {
                        resolve(false);
                    }
                    }
                    else {
                    resolve(false);
                    } 
            } else {
                resolve(false);
             }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const resendEmailAuthCode = async (userId: string, email: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let currentCode = await checkExistingCode(userId);
            if (currentCode) {
                let resendCode = await resendMailAuthCode(userId,email);
                if (resendCode){
                    resolve(true);

                } else {
                    resolve(false);
                }
            }
             else {
                resolve(false);
            }
        } catch (err: any) {
            reject(err);
        }
    });
};
