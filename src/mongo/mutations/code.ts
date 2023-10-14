import { ensureObjectId, getDB } from "../../core/config/utils/mongohelper";
import { MongoInsertError } from "../../core/errors/mongo";
import { UnauthorizedError } from "../../core/errors/user";
import { Code } from "../../models/code";
import { checkIfCodeExists } from "../queries/code";

export const createAuthCode = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            var code: string = "";
            var num: number = 0;
            var num_string = "";
            for (let i = 0; i < 6; i++) {
                num = Math.floor(Math.random() * 10);
                num_string = num.toString();
                code = code + num;
            }
            resolve(code);
        } catch(err:any){
            reject(err);
        }
    });
}

export const insertNewCode = async (userId: string, code: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Code>('codes');
            if (await checkIfCodeExists(userId)) {
                await removeExistingCode(userId);
            }
            let newCode = new Code();
            newCode.code = code;
            newCode.userId = ensureObjectId(userId);
            newCode.createdAt = new Date();
            const results = await collection.insertOne(newCode);
            if (results.acknowledged) {
                resolve(true)
            } else {
                reject(new MongoInsertError(`Something went wrong while inserting a new code for user: ${userId}`));
            }
        } catch (err: any) {
            reject(err);
        }
    });
};

export const removeExistingCode = async (userId: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            let db = await getDB();
            const collection = await db.collection<Code>('codes');
            const results = await collection.deleteOne({ userId : ensureObjectId(userId) });
            if (results.deletedCount > 0) {
                resolve(true);
            } else {
                reject(new UnauthorizedError("Your session expired"));
            }
        } catch (err: any) {
            reject(err);
        }
    });
};
