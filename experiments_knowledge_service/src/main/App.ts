import {Logger} from "log4js";
import * as express from 'express';
import * as bodyParser from 'body-parser';

import {DependencyInjection} from "./DependencyInjection";
import {ContainerConfigurationEndpoint} from "./endpoints/ContainerConfigurationEndpoint";
import {SoftwareArtefactEndpoint} from "./endpoints/SoftwareArtefactEndpoint";
import {PORT} from "./server";
import {ExperimentEndpoint} from "./endpoints/ExperimentEndpoint";
import {BenchmarkEndpoint} from "./endpoints/BenchmarkEndpoint";
import {DeploymentPatternEndpoint} from "./endpoints/DeploymentPatternEndpoint";
import {RecommendationEndpoint} from "./endpoints/RecommendationEndpoint";
import {MongoDb} from "./repository/MongoDb";


export class App {

    public express: express.Application;
    public router: express.Router;

    private logger: Logger;

    private dependencyInjection: DependencyInjection;

    private vmConfigEndpoint: ContainerConfigurationEndpoint;
    private softArtefactsEndpoint: SoftwareArtefactEndpoint;
    private experimentEndpoint: ExperimentEndpoint;
    private expResultEndpoint: BenchmarkEndpoint;
    private depPatternEndpoint: DeploymentPatternEndpoint;
    private recommendationEndpoint: RecommendationEndpoint;

    constructor() {
        this.express = express();
        this.router = express.Router();
        this.config();
    }

    async run() {

        this.dependencyInjection = new DependencyInjection();
        this.logger = this.dependencyInjection.createLogger();

        let mongoDb: MongoDb = await this.dependencyInjection.createMongoDB();
        await mongoDb.createConnection();

        this.logger.info('Waiting for the app dependencies to start...');

        // this is a small hack, waiting till all dependencies (neo4j, mongodb) are started
        await this.sleep(15000);

        this.startEndpoints();

        process.on('SIGINT', async () => {
           this.logger.info('Closing connections to databases');
           await mongoDb.closeConnection();
           await this.dependencyInjection.createGraphAPI().closeConnection();
           process.exit(0);
        });
    }

    startEndpoints() {

        this.vmConfigEndpoint = this.dependencyInjection.createVMConfigurationEndpoint();
        this.vmConfigEndpoint.routes(this.router);

        this.softArtefactsEndpoint = this.dependencyInjection.createSoftArtefactsEndpoint();
        this.softArtefactsEndpoint.routes(this.router);

        this.experimentEndpoint = this.dependencyInjection.createExperimentEndpoint();
        this.experimentEndpoint.routes(this.router);

        // this.expResultEndpoint = this.dependencyInjection.createBenchmarkEndpoint();
        // this.expResultEndpoint.routes(this.router);

        this.depPatternEndpoint = this.dependencyInjection.createDeploymentPatternEndpoint();
        this.depPatternEndpoint.routes(this.router);

        this.recommendationEndpoint = this.dependencyInjection.createRecommendationEndpoint();
        this.recommendationEndpoint.routes(this.router);

        this.logger.info(`Listening on port ${PORT}`);
        this.logger.info('Application has been started and is running!');

        // TODO close connection to mongodb on app exit
    }

    private config(): void {
        // support application/json type post data

        let bodyParserCustom = {
            json: {limit: '50mb', extended: true},
            urlencoded: {limit: '50mb', extended: true}
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

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}