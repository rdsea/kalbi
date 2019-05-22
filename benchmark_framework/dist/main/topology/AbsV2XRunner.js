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
class AbsV2XRunner {
    constructor(logger, commandExecutor, config, experimentConfiguration) {
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.config = config;
        this.experimentConfiguration = experimentConfiguration;
        this.finishedContainers = [];
        this.visitedNode = {};
        this.visitedHostMachine = {};
        this.topologyNodeTypeNames = [];
    }
    isSimulationRunning(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.visitedNode = {};
            this.visitedHostMachine = {};
            let topologyVehicleNodeNames = this.obtainAllTopologyNodeTypeNames(topology.structure, types_1.NodeType.vehicle);
            this.visitedNode = {};
            this.visitedHostMachine = {};
            this.finishedContainers = [];
            yield this.obtainFinishedDockerContainers(topology.structure);
            if (this.finishedContainers.length != topologyVehicleNodeNames.length) {
                return true;
            }
            for (let vehicleName of topologyVehicleNodeNames) {
                if (this.finishedContainers.indexOf(vehicleName) == -1) {
                    return true;
                }
            }
            this.logger.info('====== All simulation containers have finished their jobs ======');
            yield this.sleep(60000);
            return false;
        });
    }
    obtainFinishedDockerContainers(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[node.name]) {
                return;
            }
            this.visitedNode[node.name] = true;
            if (!this.visitedHostMachine[node.hostMachine.ipAddress] && node.nodeType == types_1.NodeType.vehicle) {
                this.visitedHostMachine[node.hostMachine.ipAddress] = true;
                let stopedContainers = yield this.obtainDockerFinishedContainersAtNode(node, 0);
                this.finishedContainers = this.finishedContainers.concat(stopedContainers);
            }
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                yield this.obtainFinishedDockerContainers(peer);
            }
        });
    }
    obtainDockerFinishedContainersAtNode(node, retryNr) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = `ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=30 -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'cd ~/sim-results && ls'`;
            try {
                let data = yield this.commandExecutor.executeCommand(cmd);
                data = data.substring(0, data.length - 1);
                let finishedContainerNames = [];
                data.toString().split('\n').forEach((filename) => {
                    let containerName = filename.substring(0, filename.length - 5);
                    finishedContainerNames.push(containerName);
                });
                return finishedContainerNames;
            }
            catch (e) {
                if (retryNr == 0) {
                    throw e;
                }
                this.logger.info(`========= Exception ${e}, when obtaining finished containers, retrying in 2 seconds =========`);
                yield this.sleep(2000);
                return yield this.obtainDockerFinishedContainersAtNode(node, --retryNr);
            }
        });
    }
    obtainAllTopologyNodeTypeNames(topology, nodeType) {
        this.visitedNode = {};
        this.topologyNodeTypeNames = [];
        this.obtainAllTopologyNodeTypeNamesRec(topology, nodeType);
        return this.topologyNodeTypeNames;
    }
    obtainAllTopologyNodeTypeNamesRec(topology, nodeType) {
        if (this.visitedNode[topology.name]) {
            return;
        }
        this.visitedNode[topology.name] = true;
        if (topology.nodeType == nodeType) {
            this.topologyNodeTypeNames.push(topology.name);
        }
        for (let connection of topology.connections) {
            let peer = connection.connectionEndpoint;
            this.obtainAllTopologyNodeTypeNamesRec(peer, nodeType);
        }
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.AbsV2XRunner = AbsV2XRunner;
//# sourceMappingURL=AbsV2XRunner.js.map