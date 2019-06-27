import * as log4js from "log4js";
import {Logger} from "log4js";
import * as yaml from 'js-yaml'
import {ResultsPuller} from "./benchmarks/ResultsPuller";
import {BenchmarkExecutor} from "./benchmarks/BenchmarkExecutor";
import {TCNetworkConfigurator} from "./infrastructure/TCNetworkConfigurator";
import {
    Configuration,
    ExperimentsConfiguration,
    ICloudVMService,
    INetworkConfigurator,
    IResourceUtilizationObtainer, Topology
} from "./types";
import {CommandExecutor} from "./util/CommandExecutor";
import {DockerResourceUtilizationObtainer} from "./infrastructure/DockerResourceUtilizationObtainer";
import {GCloudVMService} from "./connector/GCloudVMService";
import {TopologyHelper} from "./topology/TopologyHelper";
import {ArtefactsInstaller} from "./infrastructure/ArtefactsInstaller";
import {InfrastructureBuilder} from "./infrastructure/InfrastructureBuilder";
import {ConfigurationValidation} from "./validation/ConfigurationValidation";
import * as fs from "fs";


class Main {

    private logger: Logger;

    private resultsPuller: ResultsPuller;
    private networkConfig: INetworkConfigurator;

    private configValidation: ConfigurationValidation;

    private command: CommandExecutor;

    private benchmarkExecutor: BenchmarkExecutor;
    private resUtilObtainer: IResourceUtilizationObtainer;

    private cloudVMService: ICloudVMService;
    private topologyHelper: TopologyHelper;
    private infrastructureBuilder: InfrastructureBuilder;

    private artefactInstaller: ArtefactsInstaller;


    async run() {
        log4js.configure('config/log4js.json');
        this.logger = log4js.getLogger('default');
        this.configValidation = new ConfigurationValidation(this.logger);

        let config: Configuration = yaml.safeLoad(fs.readFileSync('config/config.yaml').toString());
        this.configValidation.checkConfig(config);

        this.command = new CommandExecutor(this.logger);
        this.topologyHelper = new TopologyHelper(this.logger);
        this.resultsPuller = new ResultsPuller(this.logger, this.command, config);
        this.cloudVMService = new GCloudVMService(this.logger, this.command, config);
        this.artefactInstaller = new ArtefactsInstaller(this.logger, this.command, config);
        this.networkConfig = new TCNetworkConfigurator(this.logger, this.command, config);
        this.resUtilObtainer = new DockerResourceUtilizationObtainer(this.logger, this.command, this.topologyHelper, config);
        this.topologyHelper = new TopologyHelper(this.logger);
        this.infrastructureBuilder = new InfrastructureBuilder(this.cloudVMService, this.logger, this.command, config);

        this.benchmarkExecutor = new BenchmarkExecutor(this.logger, config, this.resultsPuller, this.command, this.resUtilObtainer, this.topologyHelper, this.artefactInstaller, this.infrastructureBuilder, this.networkConfig);

        if (process.argv.length == 4) {

            let topologyFilename: string = process.argv[2];
            let experimentsConfigFilename: string = process.argv[3];

            let topologyStr: string = fs.readFileSync(topologyFilename).toString();
            let experimentConfigStr: string = fs.readFileSync(experimentsConfigFilename).toString();

            let topology: Topology = {
                structure: JSON.parse(topologyStr)
            };

            let experimentsConfiguration: ExperimentsConfiguration = yaml.safeLoad(experimentConfigStr);
            this.configValidation.checkExperimentsConfiguration(experimentsConfiguration);

            await this.benchmarkExecutor.benchmarkExperiments(experimentsConfiguration, topology);
        } else {
            this.printUsage();
        }
    }

    private printUsage() {
        this.logger.info('USAGE:');
        this.logger.info('npm run start topologyFilename.json experimentsConfig.yaml');
    }

}


let main = new Main();
main.run();