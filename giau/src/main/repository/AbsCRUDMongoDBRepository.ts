import {Db, InsertOneWriteOpResult, ObjectId} from "mongodb";
import {HasObjectId} from "../model/data_models";
import {IAbsCRUDMongoRepository} from "./interfaces";
import {Logger} from "log4js";
import {PersistenceException} from "./PersistenceException";
import {MongoDb} from "./MongoDb";


export abstract class AbsCRUDMongoDBRepository<T extends HasObjectId> implements IAbsCRUDMongoRepository<T> {

    protected db: Db;

    protected constructor(protected mongoDb: MongoDb, protected collectionName: string, protected logger: Logger) {
        this.db = mongoDb.getDb();
    }

    async create(dataModel: T): Promise<T> {

        try {
            let createdDataModel: InsertOneWriteOpResult = await this.db.collection(this.collectionName).insertOne(dataModel);
            let objectIdStr: ObjectId = createdDataModel.insertedId;

            dataModel._id = objectIdStr;

            return dataModel;
        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    async readAll(): Promise<T[]> {
        try {
            return await this.db.collection(this.collectionName).find<T>().toArray();
        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    async readOneById(id: string): Promise<T> {
        try {
            return await this.db.collection(this.collectionName).findOne<T>({'_id': new ObjectId(id)} );
        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    async update(id: string, data: T): Promise<T> {
        try {
            await this.db.collection(this.collectionName).updateOne( {_id: new ObjectId(id) }, { $set: data }, {upsert: true});
            return data;
        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    async delete(id: string) {
        try {
            await this.db.collection(this.collectionName).deleteOne({'_id': new ObjectId(id)});
        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }
    }

}