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
const log4js = require("log4js");
const yaml = require("js-yaml");
const ResultsPuller_1 = require("./benchmarks/ResultsPuller");
const BenchmarkExecutor_1 = require("./benchmarks/BenchmarkExecutor");
const TCNetworkConfigurator_1 = require("./infrastructure/TCNetworkConfigurator");
const CommandExecutor_1 = require("./util/CommandExecutor");
const DockerResourceUtilizationObtainer_1 = require("./infrastructure/DockerResourceUtilizationObtainer");
const GCloudVMService_1 = require("./connector/GCloudVMService");
const TopologyHelper_1 = require("./topology/TopologyHelper");
const ArtefactsInstaller_1 = require("./infrastructure/ArtefactsInstaller");
const InfrastructureBuilder_1 = require("./infrastructure/InfrastructureBuilder");
const ConfigurationValidation_1 = require("./validation/ConfigurationValidation");
const fs = require("fs");
class Main {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            log4js.configure('config/log4js.json');
            this.logger = log4js.getLogger('default');
            this.configValidation = new ConfigurationValidation_1.ConfigurationValidation(this.logger);
            let config = yaml.safeLoad(fs.readFileSync('config/config.yaml').toString());
            this.configValidation.checkConfig(config);
            this.command = new CommandExecutor_1.CommandExecutor(this.logger);
            this.topologyHelper = new TopologyHelper_1.TopologyHelper(this.logger);
            this.resultsPuller = new ResultsPuller_1.ResultsPuller(this.logger, this.command, config);
            this.cloudVMService = new GCloudVMService_1.GCloudVMService(this.logger, this.command, config);
            this.artefactInstaller = new ArtefactsInstaller_1.ArtefactsInstaller(this.logger, this.command, config);
            this.networkConfig = new TCNetworkConfigurator_1.TCNetworkConfigurator(this.logger, this.command, config);
            this.resUtilObtainer = new DockerResourceUtilizationObtainer_1.DockerResourceUtilizationObtainer(this.logger, this.command, this.topologyHelper, config);
            this.topologyHelper = new TopologyHelper_1.TopologyHelper(this.logger);
            this.infrastructureBuilder = new InfrastructureBuilder_1.InfrastructureBuilder(this.cloudVMService, this.logger, this.command, config);
            this.benchmarkExecutor = new BenchmarkExecutor_1.BenchmarkExecutor(this.logger, config, this.resultsPuller, this.command, this.resUtilObtainer, this.topologyHelper, this.artefactInstaller, this.infrastructureBuilder, this.networkConfig);
            if (process.argv.length == 4) {
                let topologyFilename = process.argv[2];
                let experimentsConfigFilename = process.argv[3];
                let topologyStr = fs.readFileSync(topologyFilename).toString();
                let experimentConfigStr = fs.readFileSync(experimentsConfigFilename).toString();
                let topology = {
                    structure: JSON.parse(topologyStr)
                };
                let experimentsConfiguration = yaml.safeLoad(experimentConfigStr);
                this.configValidation.checkExperimentsConfiguration(experimentsConfiguration);
                yield this.benchmarkExecutor.benchmarkExperiments(experimentsConfiguration, topology);
            }
            else {
                this.printUsage();
            }
        });
    }
    printUsage() {
        this.logger.info('USAGE:');
        this.logger.info('npm run start topologyFilename.json experimentsConfig.yaml');
    }
}
let main = new Main();
main.run();
//# sourceMappingURL=Main.js.map