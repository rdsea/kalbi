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
class MongoDb {
    constructor(logger) {
        this.logger = logger;
    }
    createConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            let testing = process.env.NODE_ENV === "test";
            let dev = process.env.NODE_ENV === 'dev';
            let prod = process.env.NODE_ENV === 'prod';
            let mongodb_endpoint = process.env.MONGODB_URL;
            if (mongodb_endpoint == null) {
                mongodb_endpoint = "mongodb://localhost:27017/edgeblockchain";
            }
            if (testing) {
                this.mongoClient = yield mongodb_1.MongoClient.connect("mongodb://localhost:27017/edgeblockchain-test", { useNewUrlParser: true });
                this.db = this.mongoClient.db('edgeblockchain-test');
            }
            else if (dev) {
                this.mongoClient = yield mongodb_1.MongoClient.connect(mongodb_endpoint, { useNewUrlParser: true });
                this.db = this.mongoClient.db('edgeblockchain');
            }
            else if (prod) {
                //mongodb://localhost:27017/edgeblockchain
                this.mongoClient = yield mongodb_1.MongoClient.connect(mongodb_endpoint, { useNewUrlParser: true });
                this.db = this.mongoClient.db('edgeblockchain');
            }
            else {
                this.logger.error('Invalid NODE_ENV setting!');
                process.exit(-10);
            }
        });
    }
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mongoClient.close();
        });
    }
    getDb() {
        return this.db;
    }
}
exports.MongoDb = MongoDb;
//# sourceMappingURL=MongoDb.js.map