import {Logger} from "log4js";
import {ResultsPuller} from "./ResultsPuller";
import {
    BenchmarkResult,
    BlockchainArtefact,
    BlockchainImpl,
    Configuration,
    DataExchangeAnalysis,
    Experiment,
    ExperimentsConfiguration,
    HardwareUtilization, INetworkConfigurator,
    IResourceUtilizationObtainer,
    ITopologyDeployer,
    ITopologyKiller,
    IV2XRunner,
    NodeRef,
    SynchronisationState,
    Topology,
    UtilizationAtNodesMapWithKeys
} from "../types";
import * as fs from "fs";
import {CommandExecutor} from "../util/CommandExecutor";
import {EthereumTopologyDeployer} from "../topology/ethereum/EthereumTopologyDeployer";
import {HypFabTopologyDeployer} from "../topology/hypfab/HypFabTopologyDeployer";
import {TopologyHelper} from "../topology/TopologyHelper";
import {ArtefactsInstaller} from "../infrastructure/ArtefactsInstaller";
import {InfrastructureBuilder} from "../infrastructure/InfrastructureBuilder";
import {V2XRunnerEthereum} from "../topology/ethereum/V2XRunnerEthereum";
import {EthereumSmartContractDeployer} from "../topology/ethereum/EthereumSmartContractDeployer";
import {EthereumTopologyKiller} from "../topology/ethereum/EthereumTopologyKiller";
import {V2XRunnerHypFab} from "../topology/hypfab/V2XRunnerHypFab";
import {HypFabTopologyKiller} from "../topology/hypfab/HypFabTopologyKiller";

export class BenchmarkExecutor {

    private v2xRunner: IV2XRunner;
    private topologyDeployer: ITopologyDeployer;
    private topologyKiller: ITopologyKiller;

    private benchmarkCounter: number;

    constructor(private logger: Logger,
                private config: Configuration,
                private resultsPuller: ResultsPuller,
                private commandExecutor: CommandExecutor,
                private utilStatsObtainer: IResourceUtilizationObtainer,
                private topologyHelper: TopologyHelper,
                private artefactsInstaller: ArtefactsInstaller,
                private infrastructureBuilder: InfrastructureBuilder,
                private networkConfig: INetworkConfigurator) {

    }

    public async benchmarkExperiments(experimentsSpecification: ExperimentsConfiguration, topology: Topology) {
        this.logger.info('==============================================================================');
        this.logger.info(`=================== PREPARING BENCHMARKS FOR ${experimentsSpecification.name} ==================`);
        this.logger.info('==============================================================================');

        this.benchmarkCounter = 0;
        await this.benchmarkAllBcDeployments(experimentsSpecification, topology);
    }


    private async benchmarkAllBcDeployments(experimentConfig: ExperimentsConfiguration, topology: Topology) {

        if (experimentConfig.bcImplementations && experimentConfig.bcImplementations.length > 0) { // In the config there is at least one bcImplementation iff there is some bcDeployment

            for (let bcImpl of experimentConfig.bcImplementations) {

                this.printBcMessage(bcImpl);

                for (let deployment of experimentConfig.bcDeployments) {
                    for (let bcOpsDeployment of deployment.featuresMapping) {
                        let bcArtefact: BlockchainArtefact = {
                            bcImplementation: bcImpl,
                            bcOperation: bcOpsDeployment.feature
                        };
                        this.topologyHelper.updateBlockchainArtefactInNodeType(topology.structure, bcArtefact, bcOpsDeployment.nodeType);
                    }
                    this.logger.info('==============================================================================');
                    this.logger.info(`=================== PREPARING BENCHMARKS FOR ${experimentConfig.name}, DEPLOYMENT ${deployment.id} ==================`);
                    this.logger.info('==============================================================================');

                    await this.benchmarkAllMachineConfigs(experimentConfig, topology);
                }
            }
        } else {
            await this.benchmarkAllMachineConfigs(experimentConfig, topology);
        }

    }

    private async benchmarkAllMachineConfigs(experimentConfig: ExperimentsConfiguration, topology: Topology) {

        if (experimentConfig.vehicleContainerConfigurations && experimentConfig.vehicleContainerConfigurations.length > 0) {

            for (let containerConfiguration of experimentConfig.vehicleContainerConfigurations) {

                this.logger.info('=================================================================');
                this.logger.info(`======= PREPARING BENCHMARKS WITH ${containerConfiguration.name} VEHICLE =======`);
                this.logger.info('=================================================================');

                this.topologyHelper.updateTopologyMachineType(topology.structure, containerConfiguration);

                await this.benchmarkSingleMachineConfiguration(experimentConfig, topology);
            }

        } else {
            await this.benchmarkSingleMachineConfiguration(experimentConfig, topology);
        }
    }

    private async benchmarkSingleMachineConfiguration(experimentConfig: ExperimentsConfiguration, topology: Topology) {

        this.logger.info(' === Preparing infrastructure for the benchmarks ===');

        // start required VMs in cloud
        // update container names and ip addresses in the topology nodes
        await this.infrastructureBuilder.createAndStartMachinesOfTopology(topology);
        await this.artefactsInstaller.installRequiredArtefacts(topology);

        //TODO initialize bc dependencies
        let bcImpl: BlockchainImpl = this.topologyHelper.returnUsedBlockchainImpl(topology);

        if (bcImpl == BlockchainImpl.eth) {
            this.v2xRunner = new V2XRunnerEthereum(this.logger, this.commandExecutor, this.config, experimentConfig);
            let smartContractDeployer: EthereumSmartContractDeployer = new EthereumSmartContractDeployer(this.logger, this.commandExecutor, experimentConfig, this.config);
            this.topologyDeployer = new EthereumTopologyDeployer(this.networkConfig, this.logger, this.commandExecutor, smartContractDeployer, this.infrastructureBuilder, this.config);
            this.topologyKiller = new EthereumTopologyKiller(this.networkConfig, this.logger, this.commandExecutor, this.config);
        } else if (bcImpl == BlockchainImpl.hypfab) {
            this.v2xRunner = new V2XRunnerHypFab(this.logger, this.commandExecutor, this.config, experimentConfig);
            this.topologyDeployer = new HypFabTopologyDeployer(this.networkConfig, this.logger, this.commandExecutor, this.infrastructureBuilder, this.config);
            this.topologyKiller = new HypFabTopologyKiller(this.networkConfig, this.logger, this.commandExecutor, this.config);
        } else {
            throw Error('Unsupported blockchain implementation');
        }

        await this.restartTopology(topology);

        await this.benchmarkAllNetworkQualities(experimentConfig, topology);

        this.logger.info('========= Doing cleanup after running the Benchmarks ==========');
        await this.topologyKiller.killTopology(topology);
        await this.infrastructureBuilder.stopMachinesOfTopology(topology);

    }

    private async benchmarkAllNetworkQualities(experimentConfig: ExperimentsConfiguration, topology: Topology) {

        if (experimentConfig.networkQualities && experimentConfig.networkQualities.length > 0) {
            for (let networkQuality of experimentConfig.networkQualities) {

                this.logger.info('=================================================================');
                this.logger.info(`======= PREPARING BENCHMARKS WITH ${networkQuality.name} NETWORK =======`);
                this.logger.info('=================================================================');

                this.topologyHelper.updateTopologyNetworkQuality(topology.structure, networkQuality);

                let experiment: Experiment = await this.createAndBenchmarkExperiment(experimentConfig, topology);

                let isTopologyNeededToRestart: boolean = false;

                for (let metric of experiment.benchmarkResult.qualityAttributes) {
                    if ((<SynchronisationState>metric).nodesOutOfSync) {
                        let size: number = (<SynchronisationState>metric).nodesOutOfSync.length;
                        if (size > 0) {
                            isTopologyNeededToRestart = true;
                        }
                    }
                }
                let isLastIteration: boolean = experimentConfig.networkQualities.indexOf(networkQuality) == experimentConfig.networkQualities.length - 1;
                if (!isLastIteration && isTopologyNeededToRestart) {
                    this.logger.info('====== Topology has to be created again ======');
                    await this.restartTopology(topology);
                }
            }
        } else {
            await this.createAndBenchmarkExperiment(experimentConfig, topology);
        }
    }

    private async createAndBenchmarkExperiment(expsConfig: ExperimentsConfiguration, topology: Topology): Promise<Experiment> {
        let experiment: Experiment = {
            topology: topology,
            benchmarkResult: null,
            name: `${expsConfig.name}-benchmark-${this.benchmarkCounter}`,
            id: this.benchmarkCounter++
        };
        experiment = await this.executeExperimentBenchmark(experiment);
        return experiment;
    }


    private async executeExperimentBenchmark(experiment: Experiment): Promise<Experiment> {

        let topology: Topology = experiment.topology;
        let usingBlockchain: BlockchainImpl = this.returnUsedBlockchain();

        let simulationResult: BenchmarkResult = {
            qualityAttributes: []
        };

        experiment.benchmarkResult = simulationResult;

        this.logger.info('=================================================================');
        this.logger.info(`======= RUNNING BENCHMARKS FOR EXPERIMENT ${experiment.name} =======`);
        this.logger.info('=================================================================');

        this.logger.info('====== TOPOLOGY: ======');
        this.logger.info(JSON.stringify(topology, null, 4));

        // kill old containers used for simulations
        await this.v2xRunner.killSimulationContainers(topology);
        await this.topologyKiller.resetNetworkQuality(topology);

        // starting new containers
        await this.topologyDeployer.deployNetworkQuality(topology);
        await this.v2xRunner.runV2XEnv(topology);

        this.logger.info('====== Simulation has started! ======');

        let i: number = 0;
        let threshold: number = 3;


        if (usingBlockchain == BlockchainImpl.eth) {
            threshold = 5;
        } else if (usingBlockchain == BlockchainImpl.hypfab) {
            threshold = 2;
        }

        let utilizationStatsMap: UtilizationAtNodesMapWithKeys;

        // wait till simulation ends
        while (await this.v2xRunner.isSimulationRunning(topology)) {
            i++;
            if (i == threshold) {//wait till the env is started...
                utilizationStatsMap = await this.utilStatsObtainer.obtainResourceUtilizationOfTopology(topology);
            }
            await this.sleep(30000);
        }
        this.logger.info('====== Simulation is finished! ======');

        let nodesOutOfSync: string[] = await this.topologyDeployer.obtainNodeNamesOutOfSync(topology);

        await this.resultsPuller.pullLogsAndResultsOfExperiment(experiment);//obtain analysis results

        await this.addDataToBenchmarkResult(simulationResult, utilizationStatsMap);

        let nodeRefsOutOfSync: NodeRef[] = [];
        for (let nodeOutOfSync of nodesOutOfSync) {
            let nodeRef: NodeRef = {
                name: nodeOutOfSync
            };
            nodeRefsOutOfSync.push(nodeRef);
        }

        let syncState: SynchronisationState = {
            name: 'sync state of experiment ' + experiment.name,
            description: 'nodes, which lost their sync state in ' + experiment.name,
            nodesOutOfSync: nodeRefsOutOfSync
        };

        simulationResult.qualityAttributes.push(syncState);

        utilizationStatsMap = null; // garbage to be collected

        await this.writeExperimentToFile(experiment);

        return experiment;
    }

    private async writeExperimentToFile(experiment: Experiment) {

        let experimentFilename: string = `exp-id_${experiment.id}-name_${experiment.name}.json`;
        if (fs.existsSync(`${this.config.resultsDir}/benchmarks_results/${experimentFilename}`)) {
            fs.unlinkSync(`${this.config.resultsDir}/benchmarks_results/${experimentFilename}`);
        }

        if (!fs.existsSync(`${this.config.resultsDir}/benchmarks_results`)) {
            await this.commandExecutor.executeCommand(`mkdir -p ${this.config.resultsDir}/benchmarks_results`);
        }

        fs.writeFileSync(`${this.config.resultsDir}/benchmarks_results/${experimentFilename}`, JSON.stringify(experiment, null, 4));
    }

    private returnUsedBlockchain(): BlockchainImpl {

        let bcImpl: BlockchainImpl = null;

        if (this.topologyDeployer instanceof EthereumTopologyDeployer) {
            bcImpl = BlockchainImpl.eth;
        } else if (this.topologyDeployer instanceof HypFabTopologyDeployer) {
            bcImpl = BlockchainImpl.hypfab;
        } else {
            throw Error('Unknown Blockchain implementation');
        }

        return bcImpl;

    }

    private async addDataToBenchmarkResult(simulationResult: BenchmarkResult, utilizationStatsMap: UtilizationAtNodesMapWithKeys) {

        this.logger.info(`>>> Writing results of analysis to the ${this.config.resultsDir} folder`);

        let files = fs.readdirSync('results');
        files.forEach((filename) => {
            let vehicleSimulationResultStr: string = fs.readFileSync('results/' + filename).toString();
            let vehicleSimResult: DataExchangeAnalysis = JSON.parse(vehicleSimulationResultStr);

            simulationResult.qualityAttributes.push(vehicleSimResult);
        });

        await this.commandExecutor.executeCommand('rm -rf results && mkdir results');

        for (let nodeName of utilizationStatsMap.keys) {

            if (utilizationStatsMap.utilizationMap[nodeName]) {

                let hardwareUtilization: HardwareUtilization = {
                    name: utilizationStatsMap.utilizationMap[nodeName].name,
                    description: utilizationStatsMap.utilizationMap[nodeName].description,
                    nodeRef: utilizationStatsMap.utilizationMap[nodeName].nodeRef,
                    cpuUtil: utilizationStatsMap.utilizationMap[nodeName].cpuUtil,
                    memoryUtil: utilizationStatsMap.utilizationMap[nodeName].memoryUtil
                };
                simulationResult.qualityAttributes.push(hardwareUtilization);
            }
        }

    }

    private async restartTopology(topology: Topology) {
        await this.topologyKiller.killTopology(topology);
        await this.topologyDeployer.deployTopology(topology);
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private printBcMessage(bcImpl: BlockchainImpl) {

        if (bcImpl == BlockchainImpl.eth) {

            this.logger.info('======================================================');
            this.logger.info('======================== ETHEREUM ====================');
            this.logger.info('======================================================');

        } else if (bcImpl == BlockchainImpl.hypfab) {

            this.logger.info('======================================================');
            this.logger.info('=================== HYPERLEDGER-FABRIC ===============');
            this.logger.info('======================================================');

        }

    }

}