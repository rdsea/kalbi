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
const types_1 = require("../../types");
const HypFabTopologyUtils_1 = require("./HypFabTopologyUtils");
const replacer = require("replace-in-file");
const fs = require("fs");
const fse = require("fs-extra");
const AbsV2XRunner_1 = require("../AbsV2XRunner");
class V2XRunnerHypFab extends AbsV2XRunner_1.AbsV2XRunner {
    constructor(logger, commandExecutor, config, experimentConfiguration) {
        super(logger, commandExecutor, config, experimentConfiguration);
    }
    runV2XEnv(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('======= Starting V2X Enviroment on Hyperledger fabric ======');
            this.topologyUtils = new HypFabTopologyUtils_1.HypFabTopologyUtils(topology.structure);
            let nodesInContainer = this.topologyUtils.getNodesInContainer();
            for (let i = 0; i < this.topologyUtils.getContainers().length; i++) {
                let containerName = this.topologyUtils.getContainers()[i].hostMachine.name;
                let peers = nodesInContainer[containerName];
                let hasVehicles = this.buildVehicleSimulatorsInDockerCompose(peers);
                if (hasVehicles) {
                    yield this.dockerComposeUpBlockchainInContainer(peers);
                }
            }
        });
    }
    buildVehicleSimulatorsInDockerCompose(peers) {
        let dockerComposeFilename = `hyp-fab/v2x-compose/docker-compose-v2x-${peers[0].hostMachine.name}.yaml`;
        let dockerComposeHeader = `version: '2' \n\nnetworks:\n  byfn:\n    external: true\n\n`;
        fs.appendFileSync(dockerComposeFilename, dockerComposeHeader);
        fs.appendFileSync(dockerComposeFilename, '\nservices:\n');
        let vehicles = 0;
        for (let i = 0; i < peers.length; i++) {
            let node = peers[i];
            if (node.nodeType == types_1.NodeType.VEHICLE_IOT) {
                this.addVehicleToDockerCompose(node, dockerComposeFilename);
                vehicles++;
            }
        }
        if (vehicles == 0) {
            fs.unlinkSync(dockerComposeFilename);
            return false;
        }
        return true;
    }
    addVehicleToDockerCompose(node, dockerComposeFilename) {
        fse.copyFileSync('hyp-fab/vehicle-compose-temp.yaml', 'hyp-fab/vehicle-compose.yaml');
        let vehicleComposeReplaceOptions = {
            files: 'hyp-fab/vehicle-compose.yaml',
            from: ['IMAGE_NAME', /VEHICLE_NAME/g, /VEHICLE_ID/g, 'ROUNDS_NR', 'MAIN_ORDERER_NAME'],
            to: [this.experimentConfiguration.workloadEmulator.imageTag, node.name, node.name, this.experimentConfiguration.roundsNr, this.topologyUtils.getMainOrdererName()]
        };
        replacer.sync(vehicleComposeReplaceOptions);
        let vehicleComposeYaml = fs.readFileSync('hyp-fab/vehicle-compose.yaml');
        fs.appendFileSync(dockerComposeFilename, vehicleComposeYaml + '\n' + '\n');
        fs.unlinkSync('hyp-fab/vehicle-compose.yaml');
    }
    dockerComposeUpBlockchainInContainer(nodesAtContainer) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`>>> Moving docker-compose-v2x-${nodesAtContainer[0].hostMachine.name}.yaml to container ${nodesAtContainer[0].hostMachine.name}...`);
            yield this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} hyp-fab/v2x-compose/docker-compose-v2x-${nodesAtContainer[0].hostMachine.name}.yaml ${this.config.sshUsername}@${nodesAtContainer[0].hostMachine.ipAddress}:~/hyperledger-fabric/`);
            this.logger.info('>>> Starting vehicles....');
            // paging of containers to run, because when running too many at one, it causes context deadline exceed error, when connecting to the overlay network
            let containerBatchStartLimit = 10;
            let pageSize = 0;
            let containerNames = '';
            for (let i = 0; i < nodesAtContainer.length; i++) {
                let lastIterantion = (i == (nodesAtContainer.length - 1));
                let currentNode = nodesAtContainer[i];
                if (currentNode.nodeType == types_1.NodeType.VEHICLE_IOT) {
                    containerNames = containerNames + ` ${currentNode.name}`;
                    pageSize++;
                }
                if (pageSize == containerBatchStartLimit || (lastIterantion && pageSize > 0)) {
                    this.logger.info(`>>>>>> Starting a subset of vehicle: ${containerNames}`);
                    let cmd = `cd hyperledger-fabric && COMPOSE_HTTP_TIMEOUT=1200 COMPOSE_PROJECT_NAME="" docker-compose -f docker-compose-v2x-${currentNode.hostMachine.name}.yaml up -d ${containerNames}`;
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${currentNode.hostMachine.ipAddress} '${cmd}'`);
                    yield this.sleep(5000);
                    containerNames = '';
                    pageSize = 0;
                }
            }
        });
    }
    killSimulationContainers(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.commandExecutor.executeCommand('rm -rf hyp-fab/v2x-compose');
            yield this.commandExecutor.executeCommand('mkdir hyp-fab/v2x-compose');
            this.topologyUtils = new HypFabTopologyUtils_1.HypFabTopologyUtils(topology.structure);
            this.logger.info('====== Killing old docker containers used during simulation ======');
            for (let i = 0; i < this.topologyUtils.getContainers().length; i++) {
                let containerNode = this.topologyUtils.getContainers()[i];
                let peers = this.topologyUtils.getNodesInContainer()[containerNode.hostMachine.name];
                yield this.killSimulationNodesAtContainer(peers);
            }
        });
    }
    killSimulationNodesAtContainer(nodesToKill) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodeNames = nodesToKill[0].name;
            for (let i = 1; i < nodesToKill.length; i++) {
                nodeNames = nodeNames + ' ' + nodesToKill[i].name;
            }
            // container nginx is used just to "wake up" the network on swarm workers
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodesToKill[0].hostMachine.ipAddress} 'docker stop nginx && docker rm nginx'`);
            }
            catch (e) {
            }
            let stopContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodesToKill[0].hostMachine.ipAddress} 'docker stop ${nodeNames}'`;
            let removeContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodesToKill[0].hostMachine.ipAddress} 'docker rm -f ${nodeNames}'`;
            try {
                yield this.commandExecutor.executeCommand(stopContainerCmd);
                yield this.commandExecutor.executeCommand(removeContainerCmd);
            }
            catch (e) {
                this.logger.info(e.name + ' ' + e.message);
            }
        });
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.V2XRunnerHypFab = V2XRunnerHypFab;
//# sourceMappingURL=V2XRunnerHypFab.js.map