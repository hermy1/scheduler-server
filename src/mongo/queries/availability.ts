
import { ObjectId } from 'mongodb';
import { getDB } from '../../core/config/utils/mongohelper';
import { MongoInsertError } from '../../core/errors/mongo';
import { Availability } from '../../models/availability';

//get availability by id
export const getAvailabilityById = async (id: ObjectId): Promise<Availability | null > => {
    return new Promise (async (resolve, reject) => {
        try {
            let db = await getDB();
            let availabilityCollection = db.collection<Availability>('availability');
            let availability = await availabilityCollection.findOne({_id:id});
            if(availability){
            resolve(availability);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    })
};

//get availabilitylist [array] by professor id
export const getAvailabilityListByProfessorId = async (professorId: ObjectId): Promise<Availability[] | null > => {
    return new Promise (async (resolve, reject) => {
        try {
            let db = await getDB();
            let availabilityCollection = db.collection<Availability>('availability');
            let availability = await availabilityCollection.find({professorId:professorId}).toArray();
            if(availability){
            resolve(availability);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    })
}


//get availability by professor id
export const getAvailabilityByProfessorId = async (professorId: ObjectId): Promise<Availability | null > => {
    return new Promise (async (resolve, reject) => {
        try {
            let db = await getDB();
            let availabilityCollection = db.collection<Availability>('availability');
            let availability = await availabilityCollection.findOne({professorId:professorId});
            if(availability){
            resolve(availability);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    });
};