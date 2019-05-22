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
const DependencyInjection_1 = require("../../main/DependencyInjection");
const NodeStructureTest_1 = require("./NodeStructureTest");
const RecommendationTest_1 = require("./RecommendationTest");
const assert = require('assert');
describe('DeploymentPatternService tests', () => {
    let dependecnyInjection = new DependencyInjection_1.DependencyInjection();
    let topologyService = null;
    let experimentService = null;
    let depPatternService = null;
    before(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.createConnection();
        topologyService = dependecnyInjection.createTopologyService();
        experimentService = dependecnyInjection.createExperimentService();
        depPatternService = dependecnyInjection.createDeploymentPatternService();
    }));
    after(() => __awaiter(this, void 0, void 0, function* () {
        // close db connection
        yield dependecnyInjection.createGraphAPI().closeConnection();
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.closeConnection();
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.getDb().dropDatabase();
        yield dependecnyInjection.createGraphAPI().makeGraphRequest('MATCH (n) DETACH DELETE n');
    }));
    it('createForExperimentShouldCreateDeploymentPattern', () => __awaiter(this, void 0, void 0, function* () {
        let topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        let experiment = {
            _id: null,
            depPattern: null,
            benchmark: null,
            topology: topology
        };
        let dp = yield depPatternService.readAll();
        let oldCount = dp.length;
        let createdDp = yield depPatternService.createFromExperiment(experiment); // new dp created
        assert(createdDp);
        dp = yield depPatternService.readAll();
        assert(dp.length === oldCount + 1);
        let readDp = yield depPatternService.readOne(createdDp._id);
        assert(readDp);
        assert(readDp._id == createdDp._id);
    }));
    it('createForExperimentSecondCallShouldReturnExistingDeploymentPattern', () => __awaiter(this, void 0, void 0, function* () {
        let topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        let experiment = {
            _id: null,
            depPattern: null,
            benchmark: null,
            topology: topology
        };
        let createdDp = yield depPatternService.createFromExperiment(experiment); // new dp created
        let dp = yield depPatternService.readAll();
        let oldCount = dp.length;
        experiment.topology.specificationLang = 'TOSCA';
        experiment.depPattern = null;
        let dpDuplicate = yield depPatternService.createFromExperiment(experiment); // creating from same experiment again, should return existing deploymentpattern
        dp = yield depPatternService.readAll();
        assert(dp.length === oldCount);
        assert(createdDp);
        assert(dpDuplicate);
        assert(createdDp._id == dpDuplicate._id);
    }));
    it('createForExperimentShouldReturnExistingDeploymentPattern', () => __awaiter(this, void 0, void 0, function* () {
        let topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        let experiment = {
            _id: null,
            depPattern: null,
            benchmark: null,
            topology: topology
        };
        let deploymentPattern = yield depPatternService.create(RecommendationTest_1.createDeploymentPatternLarge3());
        let dp = yield depPatternService.readAll();
        let oldCount = dp.length;
        let createdDp = yield depPatternService.createFromExperiment(experiment); // no new deployment pattern should be created
        assert(deploymentPattern._id == createdDp._id);
        dp = yield depPatternService.readAll();
        assert(dp.length === oldCount);
    }));
});
