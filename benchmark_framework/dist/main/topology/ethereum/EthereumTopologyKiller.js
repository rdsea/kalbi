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
class EthereumTopologyKiller {
    constructor(networkConfig, logger, commandExecutor, config) {
        this.networkConfig = networkConfig;
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.config = config;
        this.visitedNode = {};
        this.force = false;
    }
    /**
     * Removes all docker containers at Host (client.containerName).
     * @param client
     */
    killTopologyRec(client) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[client.name]) {
                return;
            }
            this.visitedNode[client.name] = true;
            if (!this.visitedHost[client.hostMachine.ipAddress]) {
                this.visitedHost[client.hostMachine.ipAddress] = true;
                try {
                    yield this.emptyEthereumFolderAtHost(client.hostMachine.ipAddress);
                }
                catch (e) {
                }
                let stopDockerContainers = this.createStopDockerContainersCmd(client.hostMachine.ipAddress);
                let removeDockerContainers = this.createRemoveDockerContainersCmd(client.hostMachine.ipAddress);
                try {
                    this.logger.info('>>>>>> Stoping and removing containers in machine ' + client.hostMachine.ipAddress);
                    yield this.commandExecutor.executeCommand(stopDockerContainers);
                    yield this.commandExecutor.executeCommand(removeDockerContainers);
                }
                catch (e) {
                    this.logger.info('Error at killing containers ' + e.message);
                }
                try {
                    this.logger.info('>>>>>> Removing eth network in ' + client.hostMachine.name);
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker network rm eth'`);
                }
                catch (e) {
                    this.logger.info('Error when removing bridge network ' + e.message);
                }
                try {
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'sudo rm -rf ~/logs'`);
                }
                catch (e) {
                }
                try {
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'sudo rm -rf ~/sim-results'`);
                }
                catch (e) {
                }
                if (this.force) {
                    let removeDockerGethImage = this.createRemoveDockerImagesCmd(client.hostMachine.ipAddress);
                    try {
                        this.logger.info('>>>>>> Removing filiprydzi/geth image...');
                        yield this.commandExecutor.executeCommand(removeDockerGethImage);
                    }
                    catch (e) {
                    }
                }
            }
            for (let connection of client.connections) {
                let peer = connection.connectionEndpoint;
                yield this.killTopologyRec(peer);
            }
        });
    }
    emptyEthereumFolderAtHost(hostIpAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} sudo rm -rf ~/ethereum`);
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} 'mkdir ~/ethereum'`);
        });
    }
    killTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.resetNetworkQuality(topology);
            this.logger.info('============= KILLING TOPOLOGY... =============');
            this.visitedNode = {};
            this.visitedHost = {};
            yield this.killTopologyRec(topology.structure);
            this.logger.info('============= TOPOLOGY KILLED... =============');
        });
    }
    resetNetworkQuality(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('============= RESETING NETWORK PROPERTIES... =============');
            yield this.networkConfig.resetNetworkQualityInTopology(topology);
            this.logger.info('============= NETWORK PROPERTIES RESET... =============');
        });
    }
    createStopDockerContainersCmd(ipAddress) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'docker stop $(docker ps -a -q)'`;
        return command;
    }
    createRemoveDockerContainersCmd(ipAddress) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'docker rm -f $(docker ps -a -q)'`;
        return command;
    }
    createRemoveDockerImagesCmd(ipAddress) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'docker rmi filiprydzi/geth'`;
        return command;
    }
}
exports.EthereumTopologyKiller = EthereumTopologyKiller;
//# sourceMappingURL=EthereumTopologyKiller.js.map