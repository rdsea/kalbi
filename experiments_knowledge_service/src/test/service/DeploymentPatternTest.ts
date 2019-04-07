import {DependencyInjection} from "../../main/DependencyInjection";
import {IDeploymentPatternService, IExperimentService, ITopologyService} from "../../main/service/interfaces";
import {MongoDb} from "../../main/repository/MongoDb";
import {DeploymentPattern, Experiment, Topology} from "../../main/model/dtos";
import {createStructureForInteraction4Large} from "./NodeStructureTest";
import {createDeploymentPatternLarge3} from "./RecommendationTest";


const assert = require('assert');

describe('DeploymentPatternService tests', () => {

    let dependecnyInjection: DependencyInjection = new DependencyInjection();
    let topologyService: ITopologyService = null;
    let experimentService: IExperimentService = null;
    let depPatternService: IDeploymentPatternService = null;

    before(async () => {
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.createConnection();
        topologyService = dependecnyInjection.createTopologyService();
        experimentService = dependecnyInjection.createExperimentService();
        depPatternService = dependecnyInjection.createDeploymentPatternService();
    });

    after(async () => {
        // close db connection
        await dependecnyInjection.createGraphAPI().closeConnection();
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.closeConnection();
    });

    afterEach(async () => {
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.getDb().dropDatabase();
        await dependecnyInjection.createGraphAPI().makeGraphRequest('MATCH (n) DETACH DELETE n');
    });

    it('createForExperimentShouldCreateDeploymentPattern', async () => {

        let topology: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        let experiment: Experiment = {
            _id: null,
            depPattern: null,
            benchmark: null,
            topology: topology
        };

        let dp: DeploymentPattern[] = await depPatternService.readAll();
        let oldCount: number = dp.length;

        let createdDp: DeploymentPattern = await depPatternService.createFromExperiment(experiment); // new dp created
        assert(createdDp);

        dp = await depPatternService.readAll();
        assert(dp.length === oldCount + 1);

        let readDp: DeploymentPattern = await depPatternService.readOne(createdDp._id);
        assert(readDp);
        assert(readDp._id == createdDp._id);

    });

    it('createForExperimentSecondCallShouldReturnExistingDeploymentPattern', async () => {

        let topology: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        let experiment: Experiment = {
            _id: null,
            depPattern: null,
            benchmark: null,
            topology: topology
        };

        let createdDp: DeploymentPattern = await depPatternService.createFromExperiment(experiment); // new dp created
        let dp: DeploymentPattern[] = await depPatternService.readAll();
        let oldCount: number = dp.length;

        experiment.topology.specificationLang = 'TOSCA';
        experiment.depPattern = null;
        let dpDuplicate: DeploymentPattern = await depPatternService.createFromExperiment(experiment); // creating from same experiment again, should return existing deploymentpattern

        dp = await depPatternService.readAll();
        assert(dp.length === oldCount);
        assert(createdDp);
        assert(dpDuplicate);
        assert(createdDp._id == dpDuplicate._id);
    });

    it('createForExperimentShouldReturnExistingDeploymentPattern', async () => {

        let topology: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        let experiment: Experiment = {
            _id: null,
            depPattern: null,
            benchmark: null,
            topology: topology
        };

        let deploymentPattern: DeploymentPattern = await depPatternService.create(createDeploymentPatternLarge3());

        let dp: DeploymentPattern[] = await depPatternService.readAll();
        let oldCount: number = dp.length;

        let createdDp: DeploymentPattern = await depPatternService.createFromExperiment(experiment); // no new deployment pattern should be created

        assert(deploymentPattern._id == createdDp._id);

        dp = await depPatternService.readAll();
        assert(dp.length === oldCount);
    });


});