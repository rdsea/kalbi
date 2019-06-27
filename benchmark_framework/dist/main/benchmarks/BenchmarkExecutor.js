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
const types_1 = require("../types");
const fs = require("fs");
const EthereumTopologyDeployer_1 = require("../topology/ethereum/EthereumTopologyDeployer");
const HypFabTopologyDeployer_1 = require("../topology/hypfab/HypFabTopologyDeployer");
const V2XRunnerEthereum_1 = require("../topology/ethereum/V2XRunnerEthereum");
const EthereumSmartContractDeployer_1 = require("../topology/ethereum/EthereumSmartContractDeployer");
const EthereumTopologyKiller_1 = require("../topology/ethereum/EthereumTopologyKiller");
const V2XRunnerHypFab_1 = require("../topology/hypfab/V2XRunnerHypFab");
const HypFabTopologyKiller_1 = require("../topology/hypfab/HypFabTopologyKiller");
class BenchmarkExecutor {
    constructor(logger, config, resultsPuller, commandExecutor, utilStatsObtainer, topologyHelper, artefactsInstaller, infrastructureBuilder, networkConfig) {
        this.logger = logger;
        this.config = config;
        this.resultsPuller = resultsPuller;
        this.commandExecutor = commandExecutor;
        this.utilStatsObtainer = utilStatsObtainer;
        this.topologyHelper = topologyHelper;
        this.artefactsInstaller = artefactsInstaller;
        this.infrastructureBuilder = infrastructureBuilder;
        this.networkConfig = networkConfig;
    }
    benchmarkExperiments(experimentsSpecification, topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('==============================================================================');
            this.logger.info(`=================== PREPARING BENCHMARKS FOR ${experimentsSpecification.name} ==================`);
            this.logger.info('==============================================================================');
            this.benchmarkCounter = 0;
            yield this.benchmarkAllBcDeployments(experimentsSpecification, topology);
        });
    }
    benchmarkAllBcDeployments(experimentConfig, topology) {
        return __awaiter(this, void 0, void 0, function* () {
            if (experimentConfig.bcImplementations && experimentConfig.bcImplementations.length > 0) { // In the config there is at least one bcImplementation iff there is some bcDeployment
                for (let bcImpl of experimentConfig.bcImplementations) {
                    this.printBcMessage(bcImpl);
                    for (let deployment of experimentConfig.bcDeployments) {
                        for (let bcOpsDeployment of deployment.featuresMapping) {
                            let bcArtefact = {
                                bcImplementation: bcImpl,
                                bcOperation: bcOpsDeployment.feature
                            };
                            this.topologyHelper.updateBlockchainArtefactInNodeType(topology.structure, bcArtefact, bcOpsDeployment.resourceType);
                        }
                        this.logger.info('==============================================================================');
                        this.logger.info(`=================== PREPARING BENCHMARKS FOR ${experimentConfig.name}, DEPLOYMENT ${deployment.id} ==================`);
                        this.logger.info('==============================================================================');
                        yield this.benchmarkAllMachineConfigs(experimentConfig, topology);
                    }
                }
            }
            else {
                yield this.benchmarkAllMachineConfigs(experimentConfig, topology);
            }
        });
    }
    benchmarkAllMachineConfigs(experimentConfig, topology) {
        return __awaiter(this, void 0, void 0, function* () {
            if (experimentConfig.vehicleContainerConfigurations && experimentConfig.vehicleContainerConfigurations.length > 0) {
                for (let containerConfiguration of experimentConfig.vehicleContainerConfigurations) {
                    this.logger.info('=================================================================');
                    this.logger.info(`======= PREPARING BENCHMARKS WITH ${containerConfiguration.name} VEHICLE =======`);
                    this.logger.info('=================================================================');
                    this.topologyHelper.updateTopologyMachineType(topology.structure, containerConfiguration);
                    yield this.benchmarkSingleMachineConfiguration(experimentConfig, topology);
                }
            }
            else {
                yield this.benchmarkSingleMachineConfiguration(experimentConfig, topology);
            }
        });
    }
    benchmarkSingleMachineConfiguration(experimentConfig, topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(' === Preparing infrastructure for the benchmarks ===');
            // start required VMs in cloud
            // update container names and ip addresses in the topology nodes
            yield this.infrastructureBuilder.createAndStartMachinesOfTopology(topology);
            yield this.artefactsInstaller.installRequiredArtefacts(topology);
            //TODO initialize bc dependencies
            let bcImpl = this.topologyHelper.returnUsedBlockchainImpl(topology);
            if (bcImpl == types_1.BlockchainImpl.eth) {
                this.v2xRunner = new V2XRunnerEthereum_1.V2XRunnerEthereum(this.logger, this.commandExecutor, this.config, experimentConfig);
                let smartContractDeployer = new EthereumSmartContractDeployer_1.EthereumSmartContractDeployer(this.logger, this.commandExecutor, experimentConfig, this.config);
                this.topologyDeployer = new EthereumTopologyDeployer_1.EthereumTopologyDeployer(this.networkConfig, this.logger, this.commandExecutor, smartContractDeployer, this.infrastructureBuilder, this.config);
                this.topologyKiller = new EthereumTopologyKiller_1.EthereumTopologyKiller(this.networkConfig, this.logger, this.commandExecutor, this.config);
            }
            else if (bcImpl == types_1.BlockchainImpl.hypfab) {
                this.v2xRunner = new V2XRunnerHypFab_1.V2XRunnerHypFab(this.logger, this.commandExecutor, this.config, experimentConfig);
                this.topologyDeployer = new HypFabTopologyDeployer_1.HypFabTopologyDeployer(this.networkConfig, this.logger, this.commandExecutor, this.infrastructureBuilder, this.config);
                this.topologyKiller = new HypFabTopologyKiller_1.HypFabTopologyKiller(this.networkConfig, this.logger, this.commandExecutor, this.config);
            }
            else {
                throw Error('Unsupported blockchain implementation');
            }
            yield this.restartTopology(topology);
            yield this.benchmarkAllNetworkQualities(experimentConfig, topology);
            this.logger.info('========= Doing cleanup after running the Benchmarks ==========');
            yield this.topologyKiller.killTopology(topology);
            yield this.infrastructureBuilder.stopMachinesOfTopology(topology);
        });
    }
    benchmarkAllNetworkQualities(experimentConfig, topology) {
        return __awaiter(this, void 0, void 0, function* () {
            if (experimentConfig.networkQualities && experimentConfig.networkQualities.length > 0) {
                for (let networkQuality of experimentConfig.networkQualities) {
                    this.logger.info('=================================================================');
                    this.logger.info(`======= PREPARING BENCHMARKS WITH ${networkQuality.name} NETWORK =======`);
                    this.logger.info('=================================================================');
                    this.topologyHelper.updateTopologyNetworkQuality(topology.structure, networkQuality);
                    let experiment = yield this.createAndBenchmarkExperiment(experimentConfig, topology);
                    let isTopologyNeededToRestart = false;
                    for (let metric of experiment.benchmarkResult.qualityAttributes) {
                        if (metric.nodesOutOfSync) {
                            let size = metric.nodesOutOfSync.length;
                            if (size > 0) {
                                isTopologyNeededToRestart = true;
                            }
                        }
                    }
                    let isLastIteration = experimentConfig.networkQualities.indexOf(networkQuality) == experimentConfig.networkQualities.length - 1;
                    if (!isLastIteration && isTopologyNeededToRestart) {
                        this.logger.info('====== Topology has to be created again ======');
                        yield this.restartTopology(topology);
                    }
                }
            }
            else {
                yield this.createAndBenchmarkExperiment(experimentConfig, topology);
            }
        });
    }
    createAndBenchmarkExperiment(expsConfig, topology) {
        return __awaiter(this, void 0, void 0, function* () {
            let experiment = {
                topology: topology,
                benchmarkResult: null,
                name: `${expsConfig.name}-benchmark-${this.benchmarkCounter}`,
                id: this.benchmarkCounter++
            };
            experiment = yield this.executeExperimentBenchmark(experiment);
            return experiment;
        });
    }
    executeExperimentBenchmark(experiment) {
        return __awaiter(this, void 0, void 0, function* () {
            let topology = experiment.topology;
            let usingBlockchain = this.returnUsedBlockchain();
            let simulationResult = {
                qualityAttributes: []
            };
            experiment.benchmarkResult = simulationResult;
            this.logger.info('=================================================================');
            this.logger.info(`======= RUNNING BENCHMARKS FOR EXPERIMENT ${experiment.name} =======`);
            this.logger.info('=================================================================');
            this.logger.info('====== TOPOLOGY: ======');
            this.logger.info(JSON.stringify(topology, null, 4));
            // kill old containers used for simulations
            yield this.v2xRunner.killSimulationContainers(topology);
            yield this.topologyKiller.resetNetworkQuality(topology);
            // starting new containers
            yield this.topologyDeployer.deployNetworkQuality(topology);
            yield this.v2xRunner.runV2XEnv(topology);
            this.logger.info('====== Simulation has started! ======');
            let i = 0;
            let threshold = 3;
            if (usingBlockchain == types_1.BlockchainImpl.eth) {
                threshold = 5;
            }
            else if (usingBlockchain == types_1.BlockchainImpl.hypfab) {
                threshold = 2;
            }
            let utilizationStatsMap;
            // wait till simulation ends
            while (yield this.v2xRunner.isSimulationRunning(topology)) {
                i++;
                if (i == threshold) { //wait till the env is started...
                    utilizationStatsMap = yield this.utilStatsObtainer.obtainResourceUtilizationOfTopology(topology);
                }
                yield this.sleep(30000);
            }
            this.logger.info('====== Simulation is finished! ======');
            let nodesOutOfSync = yield this.topologyDeployer.obtainNodeNamesOutOfSync(topology);
            yield this.resultsPuller.pullLogsAndResultsOfExperiment(experiment); //obtain analysis results
            yield this.addDataToBenchmarkResult(simulationResult, utilizationStatsMap);
            let nodeRefsOutOfSync = [];
            for (let nodeOutOfSync of nodesOutOfSync) {
                let nodeRef = {
                    name: nodeOutOfSync
                };
                nodeRefsOutOfSync.push(nodeRef);
            }
            let syncState = {
                name: 'sync state of experiment ' + experiment.name,
                description: 'nodes, which lost their sync state in ' + experiment.name,
                nodesOutOfSync: nodeRefsOutOfSync
            };
            simulationResult.qualityAttributes.push(syncState);
            utilizationStatsMap = null; // garbage to be collected
            yield this.writeExperimentToFile(experiment);
            return experiment;
        });
    }
    writeExperimentToFile(experiment) {
        return __awaiter(this, void 0, void 0, function* () {
            let experimentFilename = `exp-id_${experiment.id}-name_${experiment.name}.json`;
            if (fs.existsSync(`${this.config.resultsDir}/benchmarks_results/${experimentFilename}`)) {
                fs.unlinkSync(`${this.config.resultsDir}/benchmarks_results/${experimentFilename}`);
            }
            if (!fs.existsSync(`${this.config.resultsDir}/benchmarks_results`)) {
                yield this.commandExecutor.executeCommand(`mkdir -p ${this.config.resultsDir}/benchmarks_results`);
            }
            fs.writeFileSync(`${this.config.resultsDir}/benchmarks_results/${experimentFilename}`, JSON.stringify(experiment, null, 4));
        });
    }
    returnUsedBlockchain() {
        let bcImpl = null;
        if (this.topologyDeployer instanceof EthereumTopologyDeployer_1.EthereumTopologyDeployer) {
            bcImpl = types_1.BlockchainImpl.eth;
        }
        else if (this.topologyDeployer instanceof HypFabTopologyDeployer_1.HypFabTopologyDeployer) {
            bcImpl = types_1.BlockchainImpl.hypfab;
        }
        else {
            throw Error('Unknown Blockchain implementation');
        }
        return bcImpl;
    }
    addDataToBenchmarkResult(simulationResult, utilizationStatsMap) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`>>> Writing results of analysis to the ${this.config.resultsDir} folder`);
            let files = fs.readdirSync('results');
            files.forEach((filename) => {
                let vehicleSimulationResultStr = fs.readFileSync('results/' + filename).toString();
                let vehicleSimResult = JSON.parse(vehicleSimulationResultStr);
                simulationResult.qualityAttributes.push(vehicleSimResult);
            });
            yield this.commandExecutor.executeCommand('rm -rf results && mkdir results');
            for (let nodeName of utilizationStatsMap.keys) {
                if (utilizationStatsMap.utilizationMap[nodeName]) {
                    let hardwareUtilization = {
                        name: utilizationStatsMap.utilizationMap[nodeName].name,
                        description: utilizationStatsMap.utilizationMap[nodeName].description,
                        nodeRef: utilizationStatsMap.utilizationMap[nodeName].nodeRef,
                        cpuUtil: utilizationStatsMap.utilizationMap[nodeName].cpuUtil,
                        memoryUtil: utilizationStatsMap.utilizationMap[nodeName].memoryUtil
                    };
                    simulationResult.qualityAttributes.push(hardwareUtilization);
                }
            }
        });
    }
    restartTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.topologyKiller.killTopology(topology);
            yield this.topologyDeployer.deployTopology(topology);
        });
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    printBcMessage(bcImpl) {
        if (bcImpl == types_1.BlockchainImpl.eth) {
            this.logger.info('======================================================');
            this.logger.info('======================== ETHEREUM ====================');
            this.logger.info('======================================================');
        }
        else if (bcImpl == types_1.BlockchainImpl.hypfab) {
            this.logger.info('======================================================');
            this.logger.info('=================== HYPERLEDGER-FABRIC ===============');
            this.logger.info('======================================================');
        }
    }
}
exports.BenchmarkExecutor = BenchmarkExecutor;
//# sourceMappingURL=BenchmarkExecutor.js.map