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
const express = require("express");
const bodyParser = require("body-parser");
const DependencyInjection_1 = require("./DependencyInjection");
const server_1 = require("./server");
class App {
    constructor() {
        this.express = express();
        this.router = express.Router();
        this.config();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dependencyInjection = new DependencyInjection_1.DependencyInjection();
            this.logger = this.dependencyInjection.createLogger();
            let mongoDb = yield this.dependencyInjection.createMongoDB();
            yield mongoDb.createConnection();
            this.logger.info('Waiting for the app dependencies to start...');
            // this is a small hack, waiting till all dependencies (neo4j, mongodb) are started
            yield this.sleep(15000);
            this.startEndpoints();
            process.on('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
                this.logger.info('Closing connections to databases');
                yield mongoDb.closeConnection();
                yield this.dependencyInjection.createGraphAPI().closeConnection();
                process.exit(0);
            }));
        });
    }
    startEndpoints() {
        this.vmConfigEndpoint = this.dependencyInjection.createVMConfigurationEndpoint();
        this.vmConfigEndpoint.routes(this.router);
        this.softArtefactsEndpoint = this.dependencyInjection.createSoftArtefactsEndpoint();
        this.softArtefactsEndpoint.routes(this.router);
        this.experimentEndpoint = this.dependencyInjection.createExperimentEndpoint();
        this.experimentEndpoint.routes(this.router);
        this.expResultEndpoint = this.dependencyInjection.createBenchmarkEndpoint();
        this.expResultEndpoint.routes(this.router);
        this.depPatternEndpoint = this.dependencyInjection.createDeploymentPatternEndpoint();
        this.depPatternEndpoint.routes(this.router);
        this.recommendationEndpoint = this.dependencyInjection.createRecommendationEndpoint();
        this.recommendationEndpoint.routes(this.router);
        this.logger.info(`Listening on port ${server_1.PORT}`);
        this.logger.info('Application has been started and is running!');
        // TODO close connection to mongodb on app exit
    }
    config() {
        // support application/json type post data
        let bodyParserCustom = {
            json: { limit: '50mb', extended: true },
            urlencoded: { limit: '50mb', extended: true }
        };
        this.express.use(bodyParser.json({
            limit: '50mb'
        }));
        this.express.use(bodyParser.text({
            limit: '50mb'
        }));
        //support application/x-www-form-urlencoded post data
        this.express.use(bodyParser.urlencoded({
            limit: '50mb',
            extended: true,
            parameterLimit: 1000000
        }));
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.App = App;
