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
const assert = require('assert');
describe('ExperimentService tests', () => {
    let dependecnyInjection = new DependencyInjection_1.DependencyInjection();
    let topologyService = null;
    let experimentService = null;
    let depPatternService = null;
    let benchmarkService = null;
    before(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.createConnection();
        topologyService = dependecnyInjection.createTopologyService();
        experimentService = dependecnyInjection.createExperimentService();
        depPatternService = dependecnyInjection.createDeploymentPatternService();
        benchmarkService = dependecnyInjection.createBenchmarkService();
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
    it('createExperimentWithoutBenchmarkShouldOK', () => __awaiter(this, void 0, void 0, function* () {
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
        experiment = yield experimentService.create(experiment);
        assert(experiment);
        assert(experiment._id);
        assert(experiment.topology);
        let readTopology = yield topologyService.readOne(experiment.topology._id);
        assert(experiment.topology._id === readTopology._id);
        assert(experiment.depPattern);
        let readDepPattern = yield depPatternService.readOne(experiment.depPattern._id);
        assert(experiment.depPattern._id == readDepPattern._id);
        assert(experiment.depPattern.structure);
        assert(experiment.depPattern.structure.peers.length == 2);
        assert(experiment.depPattern.structure.peers[0].peers.length == 24);
        assert(experiment.depPattern.structure.peers[1].peers.length == 24);
        assert(readDepPattern.structure);
        assert(readDepPattern.structure.peers.length == 2);
        assert(readDepPattern.structure.peers[0].peers.length == 24);
        assert(readDepPattern.structure.peers[1].peers.length == 24);
        for (let i = 0; i < 24; i++) {
            assert(experiment.depPattern.structure.peers[0].peers[i]);
            assert(readDepPattern.structure.peers[0].peers[i]);
        }
        for (let i = 0; i < 24; i++) {
            assert(experiment.depPattern.structure.peers[1].peers[i]);
            assert(readDepPattern.structure.peers[1].peers[i]);
        }
    }));
    it('createExperimentWithBenchmarkShouldOK', () => __awaiter(this, void 0, void 0, function* () {
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
            benchmark: createBenchmarkMostPerformantBadReliability(),
            topology: topology
        };
        experiment = yield experimentService.create(experiment);
        let readExperiment = yield experimentService.readOne(experiment._id);
        assert(readExperiment);
        assert(readExperiment._id == experiment._id);
        let readTopology = yield topologyService.readOne(experiment.topology._id);
        assert(readTopology);
        assert(readTopology._id == experiment.topology._id);
        let readBenchmark = yield benchmarkService.readOne(experiment.benchmark._id);
        assert(readBenchmark);
        assert(readBenchmark._id == experiment.benchmark._id);
        let dp = yield depPatternService.readOne(experiment.depPattern._id);
        assert(dp);
        assert(dp._id == experiment.depPattern._id);
    }));
    it('readOneExperimentWithoutBenchmarkShouldOK', () => __awaiter(this, void 0, void 0, function* () {
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
        experiment = yield experimentService.create(experiment);
        let readExperiment = yield experimentService.readOne(experiment._id);
        assert(experiment);
        assert(experiment._id);
        assert(experiment._id == readExperiment._id);
        assert(readExperiment.topology);
        let readTopology = yield topologyService.readOne(readExperiment.topology._id);
        assert(readExperiment.topology._id === readTopology._id);
        assert(readExperiment.depPattern);
        let readDepPattern = yield depPatternService.readOne(readExperiment.depPattern._id);
        assert(readExperiment.depPattern._id == readDepPattern._id);
        assert(readExperiment.depPattern.structure);
        assert(readExperiment.depPattern.structure.peers.length == 2);
        assert(readExperiment.depPattern.structure.peers[0].peers.length == 24);
        assert(readExperiment.depPattern.structure.peers[1].peers.length == 24);
        assert(readDepPattern.structure);
        assert(readDepPattern.structure.peers.length == 2);
        assert(readDepPattern.structure.peers[0].peers.length == 24);
        assert(readDepPattern.structure.peers[1].peers.length == 24);
        for (let i = 0; i < 24; i++) {
            assert(readExperiment.depPattern.structure.peers[0].peers[i]);
            assert(readDepPattern.structure.peers[0].peers[i]);
        }
        for (let i = 0; i < 24; i++) {
            assert(readExperiment.depPattern.structure.peers[1].peers[i]);
            assert(readDepPattern.structure.peers[1].peers[i]);
        }
    }));
    it('readBestExperimentByEvaluationMetricMostReliable', () => __awaiter(this, void 0, void 0, function* () {
        let topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        let topology2 = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        let experiment1 = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkMostReliable(),
            topology: topology
        };
        let experiment2 = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkSecondMostReliable(),
            topology: topology2
        };
        experiment1 = yield experimentService.create(experiment1);
        experiment2 = yield experimentService.create(experiment2);
        let mostReliableExp = yield experimentService.readBestExperimentByEvaluationMetric(experiment1.depPattern._id, 5, 4, -1, -1);
        assert(mostReliableExp);
        assert(experiment1._id == mostReliableExp._id);
    }));
    it('readBestExperimentByEvaluationMetricMostPerformant', () => __awaiter(this, void 0, void 0, function* () {
        let topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        let topology2 = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        let topology3 = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        let experiment1 = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkSecondMostPerformant(),
            topology: topology
        };
        let experiment2 = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkMostPerformant(),
            topology: topology2
        };
        let experiment3 = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkMostPerformantBadReliability(),
            topology: topology3
        };
        experiment1 = yield experimentService.create(experiment1);
        experiment2 = yield experimentService.create(experiment2);
        experiment3 = yield experimentService.create(experiment3);
        let mostReliableExp = yield experimentService.readBestExperimentByEvaluationMetric(experiment2.depPattern._id, 5, 4, 3, -1);
        assert(mostReliableExp);
        assert(experiment2._id == mostReliableExp._id);
    }));
    it('deleteExperimentShouldDeleteAllDependencies', () => __awaiter(this, void 0, void 0, function* () {
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
            benchmark: createBenchmarkMostPerformantBadReliability(),
            topology: topology
        };
        experiment = yield experimentService.create(experiment);
        yield experimentService.delete(experiment._id);
        let readExperiment = yield experimentService.readOne(experiment._id);
        assert(readExperiment == null);
        let readTopology = yield topologyService.readOne(experiment.topology._id);
        assert(readTopology == null);
        let readBenchmark = yield benchmarkService.readOne(experiment.benchmark._id);
        assert(readBenchmark == null);
        let dp = yield depPatternService.readOne(experiment.depPattern._id); // deployment pattern is not deleted
        assert(dp);
        assert(dp._id == experiment.depPattern._id);
    }));
});
function createBenchmarkMostPerformant() {
    let benchmark = {
        _id: null,
        qualityAttributes: []
    };
    let vehicle1 = {
        name: 'vehicle1'
    };
    let vehicle2 = {
        name: 'vehicle2'
    };
    let syncState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };
    let dataExchangeAnalysisVeh1 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };
    let dataExchangeAnalysisVeh2 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };
    let txDataWrapper1 = {
        acceptationTime: 150,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper2 = {
        acceptationTime: 180,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper3 = {
        acceptationTime: 220,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper4 = {
        acceptationTime: 450,
        creationTime: 100,
        payloadData: null
    };
    let txResult1 = {
        data: txDataWrapper1,
        errorMsg: null
    };
    let txResult2 = {
        data: txDataWrapper2,
        errorMsg: null
    };
    let txResult3 = {
        data: txDataWrapper3,
        errorMsg: null
    };
    let txResult4 = {
        data: txDataWrapper4,
        errorMsg: null
    };
    dataExchangeAnalysisVeh1.txResults.push(txResult1);
    dataExchangeAnalysisVeh1.txResults.push(txResult2);
    dataExchangeAnalysisVeh2.txResults.push(txResult3);
    dataExchangeAnalysisVeh2.txResults.push(txResult4);
    benchmark.qualityAttributes.push(syncState);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh1);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh2);
    return benchmark;
}
function createBenchmarkMostPerformantBadReliability() {
    let benchmark = {
        _id: null,
        qualityAttributes: []
    };
    let vehicle1 = {
        name: 'vehicle1'
    };
    let vehicle2 = {
        name: 'vehicle2'
    };
    let syncState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };
    let dataExchangeAnalysisVeh1 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 2,
        acceptedTxCount: 0
    };
    let dataExchangeAnalysisVeh2 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };
    let txDataWrapper3 = {
        acceptationTime: 50,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper4 = {
        acceptationTime: 60,
        creationTime: 100,
        payloadData: null
    };
    let txResult1 = {
        data: null,
        errorMsg: 'error1'
    };
    let txResult2 = {
        data: null,
        errorMsg: 'errro2'
    };
    let txResult3 = {
        data: txDataWrapper3,
        errorMsg: null
    };
    let txResult4 = {
        data: txDataWrapper4,
        errorMsg: null
    };
    dataExchangeAnalysisVeh1.txResults.push(txResult1);
    dataExchangeAnalysisVeh1.txResults.push(txResult2);
    dataExchangeAnalysisVeh2.txResults.push(txResult3);
    dataExchangeAnalysisVeh2.txResults.push(txResult4);
    benchmark.qualityAttributes.push(syncState);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh1);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh2);
    return benchmark;
}
function createBenchmarkSecondMostPerformant() {
    let benchmark = {
        _id: null,
        qualityAttributes: []
    };
    let vehicle1 = {
        name: 'vehicle1'
    };
    let vehicle2 = {
        name: 'vehicle2'
    };
    let syncState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };
    let dataExchangeAnalysisVeh1 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };
    let dataExchangeAnalysisVeh2 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };
    let txDataWrapper1 = {
        acceptationTime: 150,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper2 = {
        acceptationTime: 180,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper3 = {
        acceptationTime: 1000,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper4 = {
        acceptationTime: 450,
        creationTime: 100,
        payloadData: null
    };
    let txResult1 = {
        data: txDataWrapper1,
        errorMsg: null
    };
    let txResult2 = {
        data: txDataWrapper2,
        errorMsg: null
    };
    let txResult3 = {
        data: txDataWrapper3,
        errorMsg: null
    };
    let txResult4 = {
        data: txDataWrapper4,
        errorMsg: null
    };
    dataExchangeAnalysisVeh1.txResults.push(txResult1);
    dataExchangeAnalysisVeh1.txResults.push(txResult2);
    dataExchangeAnalysisVeh2.txResults.push(txResult3);
    dataExchangeAnalysisVeh2.txResults.push(txResult4);
    benchmark.qualityAttributes.push(syncState);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh1);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh2);
    return benchmark;
}
function createBenchmarkMostReliable() {
    let benchmark = {
        _id: null,
        qualityAttributes: []
    };
    let vehicle1 = {
        name: 'vehicle1'
    };
    let vehicle2 = {
        name: 'vehicle2'
    };
    let syncState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };
    let dataExchangeAnalysisVeh1 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };
    let dataExchangeAnalysisVeh2 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };
    let txDataWrapper1 = {
        acceptationTime: 150,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper2 = {
        acceptationTime: 180,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper3 = {
        acceptationTime: 1000,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper4 = {
        acceptationTime: 450,
        creationTime: 100,
        payloadData: null
    };
    let txResult1 = {
        data: txDataWrapper1,
        errorMsg: null
    };
    let txResult2 = {
        data: txDataWrapper2,
        errorMsg: null
    };
    let txResult3 = {
        data: txDataWrapper3,
        errorMsg: null
    };
    let txResult4 = {
        data: txDataWrapper4,
        errorMsg: null
    };
    dataExchangeAnalysisVeh1.txResults.push(txResult1);
    dataExchangeAnalysisVeh1.txResults.push(txResult2);
    dataExchangeAnalysisVeh2.txResults.push(txResult3);
    dataExchangeAnalysisVeh2.txResults.push(txResult4);
    benchmark.qualityAttributes.push(syncState);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh1);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh2);
    return benchmark;
}
function createBenchmarkSecondMostReliable() {
    let benchmark = {
        _id: null,
        qualityAttributes: []
    };
    let vehicle1 = {
        name: 'vehicle1'
    };
    let vehicle2 = {
        name: 'vehicle2'
    };
    let syncState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };
    let dataExchangeAnalysisVeh1 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };
    let dataExchangeAnalysisVeh2 = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 1,
        acceptedTxCount: 1
    };
    let txDataWrapper1 = {
        acceptationTime: 150,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper2 = {
        acceptationTime: 180,
        creationTime: 100,
        payloadData: null
    };
    let txDataWrapper3 = {
        acceptationTime: 1000,
        creationTime: 100,
        payloadData: null
    };
    let txResult1 = {
        data: txDataWrapper1,
        errorMsg: null
    };
    let txResult2 = {
        data: txDataWrapper2,
        errorMsg: null
    };
    let txResult3 = {
        data: txDataWrapper3,
        errorMsg: null
    };
    let txResult4 = {
        data: null,
        errorMsg: 'error message here'
    };
    dataExchangeAnalysisVeh1.txResults.push(txResult1);
    dataExchangeAnalysisVeh1.txResults.push(txResult2);
    dataExchangeAnalysisVeh2.txResults.push(txResult3);
    dataExchangeAnalysisVeh2.txResults.push(txResult4);
    benchmark.qualityAttributes.push(syncState);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh1);
    benchmark.qualityAttributes.push(dataExchangeAnalysisVeh2);
    return benchmark;
}
