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
const neo4j = require("neo4j-driver");
class Neo4jAPI {
    constructor(logger) {
        this.logger = logger;
        let testing = process.env.NODE_ENV === "test";
        let dev = process.env.NODE_ENV === 'dev';
        let prod = process.env.NODE_ENV === 'prod';
        if (testing || dev) {
            this.driver = neo4j.v1.driver('bolt://localhost', neo4j.v1.auth.basic('neo4j', 'neo'));
        }
        else if (prod) {
            this.driver = neo4j.v1.driver('bolt://neo4j', neo4j.v1.auth.basic('neo4j', 'neo'));
        }
        else {
            this.logger.error('Invalid NODE_ENV setting!');
            process.exit(-10);
        }
    }
    makeGraphRequest(requestCmd) {
        return __awaiter(this, void 0, void 0, function* () {
            let session = this.driver.session();
            try {
                let result = yield this.executeCypherQL(requestCmd, session);
                yield session.close();
                return result;
            }
            catch (e) {
                this.logger.error('Error when executing graph request ' + e);
                yield session.close();
                return null;
            }
        });
    }
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.driver.close();
        });
    }
    executeCypherQL(cypherCmd, session) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                session.run(cypherCmd)
                    .then((result) => {
                    resolve(result);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        });
    }
}
exports.Neo4jAPI = Neo4jAPI;
//# sourceMappingURL=Neo4jAPI.js.map