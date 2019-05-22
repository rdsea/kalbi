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
class DockerResourceUtilizationObtainer {
    constructor(logger, commandExecutor, topologyHelper, config) {
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.topologyHelper = topologyHelper;
        this.config = config;
        this.visitedNode = {};
        this.visitedHost = {};
    }
    obtainResourceUtilizationOfTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodeNamesOfTopology = this.topologyHelper.obtainAllTopologyNodeNames(topology.structure);
            this.visitedNode = {};
            this.visitedHost = {};
            this.utilizationMapWithKeys = {
                keys: [],
                utilizationMap: {}
            };
            this.logger.info('=== Obtaining utilization stats... ===');
            yield this.obtainDockerStatsRec(topology.structure, nodeNamesOfTopology);
            this.logger.info('=== Utilization stats obtained ===');
            return this.utilizationMapWithKeys;
        });
    }
    obtainDockerStatsRec(topology, topologyNodeNames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[topology.name]) {
                return;
            }
            this.visitedNode[topology.name] = true;
            if (!this.visitedHost[topology.hostMachine.name]) {
                this.visitedHost[topology.hostMachine.name] = true;
                this.logger.info(`=== Obtaining utilization stats from ${topology.hostMachine.name} ===`);
                let dockerStatsCmd = `docker stats --no-stream`;
                let cmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${topology.hostMachine.ipAddress} '${dockerStatsCmd}'`;
                let utilizationStats = '';
                let data = ``;
                try {
                    utilizationStats = yield this.commandExecutor.executeCommandWithTimeout(cmd, 120 * 1000);
                    data = `Utilization of container ${topology.hostMachine.name}: \n${utilizationStats} \n`;
                }
                catch (e) {
                    data = `Utilization of container ${topology.hostMachine.name}: UTILIZATION REQUEST TIMED OUT \n`;
                }
                this.addUtilizationStatsToMap(data, topologyNodeNames);
            }
            for (let connection of topology.connections) {
                let peer = connection.connectionEndpoint;
                yield this.obtainDockerStatsRec(peer, topologyNodeNames);
            }
        });
    }
    addUtilizationStatsToMap(utilizationStats, topologyNodeNames) {
        let cpuBeginIndex;
        let ramBeginIndex;
        let nameBeginIndex;
        utilizationStats.split('\n').forEach((line) => {
            if (line.indexOf('CONTAINER ID') > -1 && line.indexOf('NAME') > -1) {
                cpuBeginIndex = line.indexOf('CPU %');
                ramBeginIndex = line.indexOf('MEM USAGE / LIMIT');
                nameBeginIndex = line.indexOf('NAME');
            }
            else {
                if (line.indexOf('Utilization of container') == -1) {
                    let nameEndIndex = line.indexOf(' ', nameBeginIndex);
                    let nameEndIndex2 = line.indexOf('_', nameBeginIndex);
                    if (nameEndIndex2 > -1 && nameEndIndex > nameEndIndex2) {
                        nameEndIndex = nameEndIndex2;
                    }
                    try {
                        let nodeName = line.substring(nameBeginIndex, nameEndIndex);
                        if (topologyNodeNames.indexOf(nodeName) > -1) { // this is a valid node in our topology
                            let cpuEndIndex = line.substring(cpuBeginIndex).indexOf('%');
                            let cpuUtil = +line.substring(cpuBeginIndex, cpuBeginIndex + cpuEndIndex);
                            let ramEndIndex = line.substring(ramBeginIndex).indexOf('MiB');
                            let ramUtil = +line.substring(ramBeginIndex, ramBeginIndex + ramEndIndex);
                            if (this.utilizationMapWithKeys.utilizationMap[nodeName]) {
                                this.utilizationMapWithKeys.utilizationMap[nodeName].cpuUtil = this.utilizationMapWithKeys.utilizationMap[nodeName].cpuUtil + cpuUtil;
                                this.utilizationMapWithKeys.utilizationMap[nodeName].memoryUtil = this.utilizationMapWithKeys.utilizationMap[nodeName].memoryUtil + cpuUtil;
                            }
                            else {
                                let hardwareUtil = {
                                    name: 'Hardware utilization of ' + nodeName,
                                    description: 'Resources Consuption by ' + nodeName,
                                    cpuUtil: cpuUtil,
                                    memoryUtil: ramUtil,
                                    nodeRef: {
                                        name: nodeName
                                    }
                                };
                                this.utilizationMapWithKeys.utilizationMap[nodeName] = hardwareUtil;
                                this.utilizationMapWithKeys.keys.push(nodeName);
                            }
                        }
                    }
                    catch (e) {
                    }
                }
            }
        });
    }
}
exports.DockerResourceUtilizationObtainer = DockerResourceUtilizationObtainer;
//# sourceMappingURL=DockerResourceUtilizationObtainer.js.map