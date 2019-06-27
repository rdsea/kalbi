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
const fs = require("file-system");
const HypFabTopologyUtils_1 = require("./HypFabTopologyUtils");
class HypFabTopologyKiller {
    constructor(networkConfig, logger, commandExecutor, config) {
        this.networkConfig = networkConfig;
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.config = config;
        this.visitedNode = {};
    }
    killTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('====== KILLING OLD TOPOLOGY ======');
            this.topologyUtils = new HypFabTopologyUtils_1.HypFabTopologyUtils(topology.structure);
            yield this.resetNetworkQuality(topology);
            this.logger.info('>>> Cleaning local directories, removing files...');
            try {
                fs.unlinkSync('hyp-fab/configtx.yaml');
            }
            catch (e) {
            }
            try {
                fs.unlinkSync('hyp-fab/crypto-config.yaml');
            }
            catch (e) {
            }
            try {
                fs.unlinkSync('hyp-fab/startPeer.sh');
            }
            catch (e) {
            }
            try {
                fs.unlinkSync('hyp-fab/startOrderer.sh');
            }
            catch (e) {
            }
            try {
                fs.unlinkSync('hyp-fab/startCli.sh');
            }
            catch (e) {
            }
            try {
                fs.unlinkSync('hyp-fab/docker-compose-kafka-ca.yaml');
            }
            catch (e) {
            }
            try {
                fs.unlinkSync('hyp-fab/scripts/script.sh');
            }
            catch (e) {
            }
            yield this.commandExecutor.executeCommand('rm -rf hyp-fab/crypto-config');
            yield this.commandExecutor.executeCommand('rm -rf hyp-fab/channel-artifacts');
            yield this.commandExecutor.executeCommand('rm -rf hyp-fab/bc-compose');
            yield this.commandExecutor.executeCommand('mkdir hyp-fab/bc-compose');
            yield this.commandExecutor.executeCommand('rm -rf hyp-fab/v2x-compose');
            yield this.commandExecutor.executeCommand('mkdir hyp-fab/v2x-compose');
            this.visitedNode = {};
            this.visitedHost = {};
            yield this.stopAndRemoveDockerContainersRec(topology.structure);
            let swarmLeader = this.getSwarmLeader(topology.structure);
            this.logger.info(`>>> Retrieved swarm leader ${swarmLeader.name} is going to be killed as last...`);
            for (let i = 0; i < this.topologyUtils.getContainers().length; i++) {
                let container = this.topologyUtils.getContainers()[i];
                if (container.name.localeCompare(swarmLeader.name)) {
                    this.logger.info(`>>> ${container.hostMachine.name} is leaving docker swarm...`);
                    yield this.setWorkerAvailabilityToDrain(container, swarmLeader.hostMachine.ipAddress);
                    yield this.setWorkerAvailabilityToActive(container, swarmLeader.hostMachine.ipAddress);
                    yield this.removeNodeFromTheSwarm(container);
                    yield this.setWorkerAvailabilityToDrain(container, swarmLeader.hostMachine.ipAddress);
                    yield this.removeWorkerNodeOnMaster(container, swarmLeader.hostMachine.ipAddress);
                }
            }
            this.logger.info(`>>> ${swarmLeader.hostMachine.name} is leaving docker swarm...`);
            yield this.removeNodeFromTheSwarm(swarmLeader);
            this.logger.info('====== OLD TOPOLOGY KILLED ======');
        });
    }
    getSwarmLeader(node) {
        let swarmLeader = null;
        if (node.resourceType == types_1.ResourceType.VEHICLE_IOT) {
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                if (peer.resourceType != types_1.ResourceType.VEHICLE_IOT) {
                    swarmLeader = peer;
                    break;
                }
            }
        }
        else {
            swarmLeader = node;
        }
        return swarmLeader;
    }
    removeHfcKeyStoreFolderOfVehicleNode(hostIpAddress, nodeName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} 'sudo rm -rf ~/hfc-key-store${nodeName}'`);
        });
    }
    stopAndRemoveDockerContainersRec(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[node.name]) {
                return;
            }
            this.visitedNode[node.name] = true;
            if (node.resourceType == types_1.ResourceType.VEHICLE_IOT) {
                try {
                    yield this.removeHfcKeyStoreFolderOfVehicleNode(node.hostMachine.ipAddress, node.name);
                }
                catch (e) {
                }
            }
            if (!this.visitedHost[node.hostMachine.name]) {
                this.visitedHost[node.hostMachine.name] = true;
                yield this.stopAndRemoveContainersAtNode(node);
            }
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                yield this.stopAndRemoveDockerContainersRec(peer);
            }
        });
    }
    stopAndRemoveContainersAtNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`>>> Stoping and removing containers in ${node.hostMachine.name}`);
            yield this.emptyHyperledgerFabricFolderAtHost(node.hostMachine.ipAddress);
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker stop $(docker ps -a -q)'`);
            }
            catch (e) {
            }
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker rm -f $(docker ps -a -q)'`);
            }
            catch (e) {
            }
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker volume rm $(docker volume ls -q)'`);
            }
            catch (e) {
            }
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'sudo rm -rf ~/logs'`);
            }
            catch (e) {
            }
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'sudo rm -rf ~/sim-results'`);
            }
            catch (e) {
            }
        });
    }
    emptyHyperledgerFabricFolderAtHost(hostIpAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} 'sudo rm -rf ~/hyperledger-fabric'`);
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} 'mkdir ~/hyperledger-fabric'`);
        });
    }
    setWorkerAvailabilityToDrain(workerNode, swarmLeaderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${swarmLeaderAddress} 'docker node update --availability drain ${workerNode.hostMachine.name}'`);
            }
            catch (e) {
                this.logger.info('>>>>>> Error when setting worker avail to drain...' + e.message);
            }
        });
    }
    setWorkerAvailabilityToActive(workerNode, swarmLeaderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${swarmLeaderAddress} 'docker node update --availability active ${workerNode.hostMachine.name}'`);
            }
            catch (e) {
                this.logger.info('>>>>>> Error when setting worker avail to drain...' + e.message);
            }
        });
    }
    removeNodeFromTheSwarm(node) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker swarm leave -f'`);
            }
            catch (e) {
                this.logger.info('>>>>>> Error when leaving docker swarm...' + e.message);
            }
        });
    }
    removeWorkerNodeOnMaster(workerNode, swarmLeaderAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${swarmLeaderAddress} 'docker node rm ${workerNode.hostMachine.name}'`);
            }
            catch (e) {
                this.logger.info('>>>>>> Error when removing node...' + e.message);
            }
        });
    }
    resetNetworkQuality(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('============= RESETING NETWORK PROPERTIES... =============');
            yield this.networkConfig.resetNetworkQualityInTopology(topology);
            this.logger.info('============= NETWORK PROPERTIES RESET... =============');
        });
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.HypFabTopologyKiller = HypFabTopologyKiller;
//# sourceMappingURL=HypFabTopologyKiller.js.map