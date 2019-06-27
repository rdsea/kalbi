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
const fs = require("fs");
const fse = require("fs-extra");
const replacer = require("replace-in-file");
const EthTopologyUtils_1 = require("./EthTopologyUtils");
const EthereumSmartContractDeployer_1 = require("./EthereumSmartContractDeployer");
const AbsV2XRunner_1 = require("../AbsV2XRunner");
class V2XRunnerEthereum extends AbsV2XRunner_1.AbsV2XRunner {
    constructor(logger, commandExecutor, config, experimentConfig) {
        super(logger, commandExecutor, config, experimentConfig);
    }
    runV2XEnv(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.topologyUtils = new EthTopologyUtils_1.EthTopologyUtils(topology.structure);
            this.logger.info('======= Starting V2X Enviroment on Ethereum ======');
            this.logger.info('====== Starting the V2X Environment in Docker containers ======');
            let nodesInContainer = this.topologyUtils.getNodesInContainer();
            for (let i = 0; i < this.topologyUtils.getContainers().length; i++) {
                let containerName = this.topologyUtils.getContainers()[i].hostMachine.name;
                let peers = nodesInContainer[containerName];
                let hasVehicles = yield this.buildVehicleSimulatorsInDockerCompose(peers, EthereumSmartContractDeployer_1.EthereumSmartContractDeployer.smartContractAddress);
                if (hasVehicles) {
                    yield this.dockerComposeUpBlockchainInContainer(peers);
                }
            }
        });
    }
    buildVehicleSimulatorsInDockerCompose(peers, contractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            let bcIPAddressesMap = yield this.obtainIPAddressesOfBlockchainContainers(peers);
            let dockerComposeFilename = `eth/v2x-compose/docker-compose-v2x-${peers[0].hostMachine.name}.yaml`;
            let dockerComposeHeader = `version: '2' \n\nnetworks:\n  eth:\n    external: true\n\n`;
            fs.appendFileSync(dockerComposeFilename, dockerComposeHeader);
            fs.appendFileSync(dockerComposeFilename, '\nservices:\n');
            let vehicles = 0;
            for (let i = 0; i < peers.length; i++) {
                let node = peers[i];
                let bcIpAddress = bcIPAddressesMap[node.name];
                if (node.nodeType == types_1.NodeType.VEHICLE_IOT) {
                    this.addVehicleToDockerCompose(node, bcIpAddress, contractAddress, dockerComposeFilename);
                    vehicles++;
                }
            }
            if (vehicles == 0) {
                fs.unlinkSync(dockerComposeFilename);
                return false;
            }
            return true;
        });
    }
    addVehicleToDockerCompose(node, bcIpAddress, contractAddress, dockerComposeFilename) {
        fse.copyFileSync('eth/vehicle-compose-temp.yaml', 'eth/vehicle-compose.yaml');
        let vehicleComposeReplaceOptions = {
            files: 'eth/vehicle-compose.yaml',
            from: ['IMAGE_NAME', /VEHICLE_NAME/g, /VEHICLE_ID/g, 'ROUNDS_NR', 'BC_IP_ADDRESS', 'CONTRACT_ADDRESS'],
            to: [this.experimentConfiguration.workloadEmulator.imageTag, node.name, node.name, this.experimentConfiguration.roundsNr, bcIpAddress, contractAddress]
        };
        replacer.sync(vehicleComposeReplaceOptions);
        let vehicleComposeYaml = fs.readFileSync('eth/vehicle-compose.yaml');
        fs.appendFileSync(dockerComposeFilename, vehicleComposeYaml + '\n' + '\n');
        fs.unlinkSync('eth/vehicle-compose.yaml');
    }
    dockerComposeUpBlockchainInContainer(nodesAtContainer) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`>>> Moving docker-compose-v2x-${nodesAtContainer[0].hostMachine.name}.yaml to container ${nodesAtContainer[0].hostMachine.name}...`);
            yield this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} eth/v2x-compose/docker-compose-v2x-${nodesAtContainer[0].hostMachine.name}.yaml ${this.config.sshUsername}@${nodesAtContainer[0].hostMachine.ipAddress}:~/ethereum/`);
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
                    this.logger.info(`>>>>>> Starting a subset of vehicles: ${containerNames}`);
                    let cmd = `cd ethereum && COMPOSE_HTTP_TIMEOUT=1200 COMPOSE_PROJECT_NAME="" docker-compose -f docker-compose-v2x-${currentNode.hostMachine.name}.yaml up -d ${containerNames}`;
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${currentNode.hostMachine.ipAddress} '${cmd}'`);
                    containerNames = '';
                    pageSize = 0;
                    yield this.sleep(5000);
                }
            }
        });
    }
    killSimulationContainers(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.commandExecutor.executeCommand('rm -rf eth/v2x-compose');
            yield this.commandExecutor.executeCommand('mkdir eth/v2x-compose');
            this.topologyUtils = new EthTopologyUtils_1.EthTopologyUtils(topology.structure);
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
    obtainIPAddressesOfBlockchainContainers(nodes) {
        return __awaiter(this, void 0, void 0, function* () {
            let bcIPAddresses = {};
            let containerNames = '';
            for (let node of nodes) {
                containerNames = containerNames + ` ${node.name}_bc`;
            }
            let cmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodes[0].hostMachine.ipAddress} "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${containerNames}"`;
            let data = yield this.commandExecutor.executeCommand(cmd);
            data = data.substring(0, data.length - 1); // cutting of the \n at the end
            let i = 0;
            data.toString().split('\n').forEach((bcIPAddress) => {
                bcIPAddresses[nodes[i].name] = bcIPAddress + ':8545';
                i++;
            });
            return bcIPAddresses;
        });
    }
}
exports.V2XRunnerEthereum = V2XRunnerEthereum;
//# sourceMappingURL=V2XRunnerEthereum.js.map