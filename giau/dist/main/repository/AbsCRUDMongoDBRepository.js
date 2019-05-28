"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const PersistenceException_1 = require("./PersistenceException");
class AbsCRUDMongoDBRepository {
    constructor(mongoDb, collectionName, logger) {
        this.mongoDb = mongoDb;
        this.collectionName = collectionName;
        this.logger = logger;
        this.db = mongoDb.getDb();
    }
    create(dataModel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let createdDataModel = yield this.db.collection(this.collectionName).insertOne(dataModel);
                let objectIdStr = createdDataModel.insertedId;
                dataModel._id = objectIdStr;
                return dataModel;
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    readAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.db.collection(this.collectionName).find().toArray();
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    readOneById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.db.collection(this.collectionName).findOne({ '_id': new mongodb_1.ObjectId(id) });
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.collection(this.collectionName).updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: data }, { upsert: true });
                return data;
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.collection(this.collectionName).deleteOne({ '_id': new mongodb_1.ObjectId(id) });
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
}
exports.AbsCRUDMongoDBRepository = AbsCRUDMongoDBRepository;
//# sourceMappingURL=AbsCRUDMongoDBRepository.js.map