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
class TCNetworkConfigurator {
    constructor(logger, commandExecutor, config) {
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.config = config;
        this.visitedNode = {};
        this.visitedHost = {};
    }
    //TODO change the solution here, such that each connection can have different network properties
    setupNetworkQualityInTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.visitedNode = {};
            this.visitedHost = {};
            let netQuality = null;
            let root = topology.structure;
            if (root.connections && root.connections[0] && root.connections[0].netQuality) {
                netQuality = root.connections[0].netQuality;
            }
            yield this.setupNetworkQualityInTopologyRec(root, netQuality);
        });
    }
    setupNetworkQualityInTopologyRec(root, netQuality) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[root.name]) {
                return;
            }
            this.visitedNode[root.name] = true;
            if (!this.visitedHost[root.hostMachine.name]) {
                this.visitedHost[root.hostMachine.name] = true;
                if (netQuality) {
                    this.logger.info(`>>> Setting network quality to ${netQuality.name} at ${root.hostMachine.name} at address ${root.hostMachine.ipAddress}`);
                    let createInterfaceCmd = this.createNetworkInterfaceCommand(root.hostMachine.ipAddress);
                    let setBandwidthCmd = this.createSetBandwidthCommand(root.hostMachine.ipAddress, netQuality);
                    let setLatencyCmd = this.createSetLatencyCommand(root.hostMachine.ipAddress, netQuality);
                    try {
                        yield this.commandExecutor.executeCommand(createInterfaceCmd);
                        yield this.commandExecutor.executeCommand(setBandwidthCmd);
                        yield this.commandExecutor.executeCommand(setLatencyCmd);
                    }
                    catch (e) {
                        this.logger.info(e.name + ' ' + e.message);
                    }
                }
            }
            for (let connection of root.connections) {
                let peer = connection.connectionEndpoint;
                yield this.setupNetworkQualityInTopologyRec(peer, netQuality);
            }
        });
    }
    resetNetworkQualityInTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.visitedNode = {};
            this.visitedHost = {};
            yield this.resetNetworkQualityInTopologyRec(topology.structure);
        });
    }
    resetNetworkQualityInTopologyRec(root) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[root.name]) {
                return;
            }
            this.visitedNode[root.name] = true;
            if (!this.visitedHost[root.hostMachine.name]) {
                this.visitedHost[root.hostMachine.name] = true;
                try {
                    let resetCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${root.hostMachine.ipAddress} 'sudo tc qdisc del dev ens4 root'`;
                    this.logger.info('>>> Reseting network configuration at ' + root.hostMachine.name);
                    yield this.commandExecutor.executeCommand(resetCmd);
                }
                catch (e) {
                    this.logger.info('Exception when reset net config');
                }
            }
            for (let connection of root.connections) {
                let peer = connection.connectionEndpoint;
                yield this.resetNetworkQualityInTopologyRec(peer);
            }
        });
    }
    createNetworkInterfaceCommand(ipAddress) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'sudo tc qdisc add dev ens4 root handle 1: htb default 12'`;
        return command;
    }
    createSetBandwidthCommand(ipAddress, quality) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'sudo tc class add dev ens4 parent 1:1 classid 1:12 htb rate ${quality.bandwidth} ceil ${quality.bandwidth}'`;
        return command;
    }
    createSetLatencyCommand(ipAddress, quality) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'sudo tc qdisc add dev ens4 parent 1:12 netem delay ${quality.latency}'`;
        return command;
    }
}
exports.TCNetworkConfigurator = TCNetworkConfigurator;
//# sourceMappingURL=TCNetworkConfigurator.js.map