import {DependencyInjection} from "../../main/DependencyInjection";
import {
    IBenchmarkService,
    IDeploymentPatternService, IExperimentService,
    ITopologyService
} from "../../main/service/interfaces";
import {
    Benchmark,
    DataExchangeAnalysis,
    DeploymentPattern,
    Experiment, NodeRef,
    SynchronisationState,
    Topology, TransactionAnalysisWrapper, TransactionResult
} from "../../main/model/dtos";
import {createStructureForInteraction4Large} from "./NodeStructureTest";
import {MongoDb} from "../../main/repository/MongoDb";


const assert = require('assert');

describe('ExperimentService tests', () => {

    let dependecnyInjection: DependencyInjection = new DependencyInjection();
    let topologyService: ITopologyService = null;
    let experimentService: IExperimentService = null;
    let depPatternService: IDeploymentPatternService = null;
    let benchmarkService: IBenchmarkService = null;

    before(async () => {
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.createConnection();
        topologyService = dependecnyInjection.createTopologyService();
        experimentService = dependecnyInjection.createExperimentService();
        depPatternService = dependecnyInjection.createDeploymentPatternService();
        benchmarkService = dependecnyInjection.createBenchmarkService();
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

    it('createExperimentWithoutBenchmarkShouldOK', async () => {

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

        experiment = await experimentService.create(experiment);

        assert(experiment);
        assert(experiment._id);

        assert(experiment.topology);
        let readTopology: Topology = await topologyService.readOne(experiment.topology._id);
        assert(experiment.topology._id === readTopology._id);

        assert(experiment.depPattern);
        let readDepPattern: DeploymentPattern = await depPatternService.readOne(experiment.depPattern._id);
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

    });

    it('createExperimentWithBenchmarkShouldOK', async () => {

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
            benchmark: createBenchmarkMostPerformantBadReliability(),
            topology: topology
        };

        experiment = await experimentService.create(experiment);

        let readExperiment: Experiment = await experimentService.readOne(experiment._id);
        assert(readExperiment);
        assert(readExperiment._id == experiment._id);

        let readTopology: Topology = await topologyService.readOne(experiment.topology._id);
        assert(readTopology);
        assert(readTopology._id == experiment.topology._id);

        let readBenchmark: Benchmark = await benchmarkService.readOne(experiment.benchmark._id);
        assert(readBenchmark);
        assert(readBenchmark._id == experiment.benchmark._id);

        let dp: DeploymentPattern = await depPatternService.readOne(experiment.depPattern._id);
        assert(dp);
        assert(dp._id == experiment.depPattern._id);
    });

    it('readOneExperimentWithoutBenchmarkShouldOK', async () => {

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

        experiment = await experimentService.create(experiment);
        let readExperiment: Experiment = await experimentService.readOne(experiment._id);

        assert(experiment);
        assert(experiment._id);
        assert(experiment._id == readExperiment._id);

        assert(readExperiment.topology);
        let readTopology: Topology = await topologyService.readOne(readExperiment.topology._id);
        assert(readExperiment.topology._id === readTopology._id);

        assert(readExperiment.depPattern);
        let readDepPattern: DeploymentPattern = await depPatternService.readOne(readExperiment.depPattern._id);
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

    });

    it('readBestExperimentByEvaluationMetricMostReliable', async () => {


        let topology: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        let topology2: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        let experiment1: Experiment = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkMostReliable(),
            topology: topology
        };

        let experiment2: Experiment = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkSecondMostReliable(),
            topology: topology2
        };

        experiment1 = await experimentService.create(experiment1);
        experiment2 = await experimentService.create(experiment2);

        let mostReliableExp: Experiment = await experimentService.readBestExperimentByEvaluationMetric(experiment1.depPattern._id, 5, 4, -1, -1);
        assert(mostReliableExp);
        assert(experiment1._id == mostReliableExp._id);
    });

    it('readBestExperimentByEvaluationMetricMostPerformant', async () => {


        let topology: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        let topology2: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        let topology3: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        let experiment1: Experiment = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkSecondMostPerformant(),
            topology: topology
        };

        let experiment2: Experiment = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkMostPerformant(),
            topology: topology2
        };

        let experiment3: Experiment = {
            _id: null,
            depPattern: null,
            benchmark: createBenchmarkMostPerformantBadReliability(),
            topology: topology3
        };

        experiment1 = await experimentService.create(experiment1);
        experiment2 = await experimentService.create(experiment2);
        experiment3 = await experimentService.create(experiment3);

        let mostReliableExp: Experiment = await experimentService.readBestExperimentByEvaluationMetric(experiment2.depPattern._id, 5, 4, 3, -1);
        assert(mostReliableExp);
        assert(experiment2._id == mostReliableExp._id);
    });



    it('deleteExperimentShouldDeleteAllDependencies', async () => {

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
            benchmark: createBenchmarkMostPerformantBadReliability(),
            topology: topology
        };

        experiment = await experimentService.create(experiment);
        await experimentService.delete(experiment._id);

        let readExperiment: Experiment = await experimentService.readOne(experiment._id);
        assert(readExperiment == null);

        let readTopology: Topology = await topologyService.readOne(experiment.topology._id);
        assert(readTopology == null);

        let readBenchmark: Benchmark = await benchmarkService.readOne(experiment.benchmark._id);
        assert(readBenchmark == null);

        let dp: DeploymentPattern = await depPatternService.readOne(experiment.depPattern._id); // deployment pattern is not deleted
        assert(dp);
        assert(dp._id == experiment.depPattern._id);
    });

});


function createBenchmarkMostPerformant(): Benchmark {

    let benchmark: Benchmark = {
        _id: null,
        qualityAttributes: []
    };

    let vehicle1: NodeRef = {
        name: 'vehicle1'
    };
    let vehicle2: NodeRef = {
        name: 'vehicle2'
    };

    let syncState: SynchronisationState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };

    let dataExchangeAnalysisVeh1: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };

    let dataExchangeAnalysisVeh2: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };

    let txDataWrapper1: TransactionAnalysisWrapper = {
        acceptationTime: 150,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper2: TransactionAnalysisWrapper = {
        acceptationTime: 180,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper3: TransactionAnalysisWrapper = {
        acceptationTime: 220,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper4: TransactionAnalysisWrapper = {
        acceptationTime: 450,
        creationTime: 100,
        payloadData: null
    };

    let txResult1: TransactionResult = {
        data: txDataWrapper1,
        errorMsg: null
    };

    let txResult2: TransactionResult = {
        data: txDataWrapper2,
        errorMsg: null
    };

    let txResult3: TransactionResult = {
        data: txDataWrapper3,
        errorMsg: null
    };

    let txResult4: TransactionResult = {
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

function createBenchmarkMostPerformantBadReliability(): Benchmark {

    let benchmark: Benchmark = {
        _id: null,
        qualityAttributes: []
    };

    let vehicle1: NodeRef = {
        name: 'vehicle1'
    };
    let vehicle2: NodeRef = {
        name: 'vehicle2'
    };

    let syncState: SynchronisationState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };

    let dataExchangeAnalysisVeh1: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 2,
        acceptedTxCount: 0
    };

    let dataExchangeAnalysisVeh2: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };

    let txDataWrapper3: TransactionAnalysisWrapper = {
        acceptationTime: 50,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper4: TransactionAnalysisWrapper = {
        acceptationTime: 60,
        creationTime: 100,
        payloadData: null
    };

    let txResult1: TransactionResult = {
        data: null,
        errorMsg: 'error1'
    };

    let txResult2: TransactionResult = {
        data: null,
        errorMsg: 'errro2'
    };

    let txResult3: TransactionResult = {
        data: txDataWrapper3,
        errorMsg: null
    };

    let txResult4: TransactionResult = {
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


function createBenchmarkSecondMostPerformant(): Benchmark {

    let benchmark: Benchmark = {
        _id: null,
        qualityAttributes: []
    };

    let vehicle1: NodeRef = {
        name: 'vehicle1'
    };
    let vehicle2: NodeRef = {
        name: 'vehicle2'
    };

    let syncState: SynchronisationState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };

    let dataExchangeAnalysisVeh1: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };

    let dataExchangeAnalysisVeh2: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };

    let txDataWrapper1: TransactionAnalysisWrapper = {
        acceptationTime: 150,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper2: TransactionAnalysisWrapper = {
        acceptationTime: 180,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper3: TransactionAnalysisWrapper = {
        acceptationTime: 1000,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper4: TransactionAnalysisWrapper = {
        acceptationTime: 450,
        creationTime: 100,
        payloadData: null
    };

    let txResult1: TransactionResult = {
        data: txDataWrapper1,
        errorMsg: null
    };

    let txResult2: TransactionResult = {
        data: txDataWrapper2,
        errorMsg: null
    };

    let txResult3: TransactionResult = {
        data: txDataWrapper3,
        errorMsg: null
    };

    let txResult4: TransactionResult = {
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


function createBenchmarkMostReliable(): Benchmark {

    let benchmark: Benchmark = {
        _id: null,
        qualityAttributes: []
    };

    let vehicle1: NodeRef = {
        name: 'vehicle1'
    };
    let vehicle2: NodeRef = {
        name: 'vehicle2'
    };

    let syncState: SynchronisationState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };

    let dataExchangeAnalysisVeh1: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };

    let dataExchangeAnalysisVeh2: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };

    let txDataWrapper1: TransactionAnalysisWrapper = {
        acceptationTime: 150,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper2: TransactionAnalysisWrapper = {
        acceptationTime: 180,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper3: TransactionAnalysisWrapper = {
        acceptationTime: 1000,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper4: TransactionAnalysisWrapper = {
        acceptationTime: 450,
        creationTime: 100,
        payloadData: null
    };

    let txResult1: TransactionResult = {
        data: txDataWrapper1,
        errorMsg: null
    };

    let txResult2: TransactionResult = {
        data: txDataWrapper2,
        errorMsg: null
    };

    let txResult3: TransactionResult = {
        data: txDataWrapper3,
        errorMsg: null
    };

    let txResult4: TransactionResult = {
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


function createBenchmarkSecondMostReliable(): Benchmark {

    let benchmark: Benchmark = {
        _id: null,
        qualityAttributes: []
    };

    let vehicle1: NodeRef = {
        name: 'vehicle1'
    };
    let vehicle2: NodeRef = {
        name: 'vehicle2'
    };

    let syncState: SynchronisationState = {
        _id: null,
        description: 'blabla',
        name: 'number of nodes which were out of sync',
        nodesOutOfSync: []
    };

    let dataExchangeAnalysisVeh1: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle1,
        txResults: [],
        failedTxCount: 0,
        acceptedTxCount: 2
    };

    let dataExchangeAnalysisVeh2: DataExchangeAnalysis = {
        name: 'data exchange analysis',
        description: '',
        _id: null,
        nodeRef: vehicle2,
        txResults: [],
        failedTxCount: 1,
        acceptedTxCount: 1
    };

    let txDataWrapper1: TransactionAnalysisWrapper = {
        acceptationTime: 150,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper2: TransactionAnalysisWrapper = {
        acceptationTime: 180,
        creationTime: 100,
        payloadData: null
    };

    let txDataWrapper3: TransactionAnalysisWrapper = {
        acceptationTime: 1000,
        creationTime: 100,
        payloadData: null
    };

    let txResult1: TransactionResult = {
        data: txDataWrapper1,
        errorMsg: null
    };

    let txResult2: TransactionResult = {
        data: txDataWrapper2,
        errorMsg: null
    };

    let txResult3: TransactionResult = {
        data: txDataWrapper3,
        errorMsg: null
    };

    let txResult4: TransactionResult = {
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