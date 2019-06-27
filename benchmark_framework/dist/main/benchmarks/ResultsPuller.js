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
const fs = require("fs");
class ResultsPuller {
    constructor(logger, commandExecutor, config) {
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.config = config;
        this.visitedNode = {};
        this.visitedContainer = {};
    }
    moveAndRenameVehicleSimulationLogs(experiment) {
        return __awaiter(this, void 0, void 0, function* () {
            // rename analysis results
            let files = fs.readdirSync('vehicle_logs');
            files.forEach((filename) => __awaiter(this, void 0, void 0, function* () {
                let filenamePrefix = `exp-id_${experiment.id}-name_${experiment.name}`;
                let targetFilename = `${this.config.resultsDir}/emulated_vehicles_logs/${filenamePrefix}-${filename}`;
                if (!fs.existsSync(`${this.config.resultsDir}/emulated_vehicles_logs`)) {
                    yield this.commandExecutor.executeCommand(`mkdir -p ${this.config.resultsDir}/emulated_vehicles_logs`);
                }
                if (fs.existsSync(targetFilename)) { // if there is something from previous simulation
                    fs.unlinkSync(targetFilename);
                }
                fs.renameSync(`vehicle_logs/${filename}`, targetFilename);
            }));
        });
    }
    pullLogsAndResultsOfExperiment(experiment) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('====== Obtaining results of the simulations ======');
            this.visitedNode = {};
            this.visitedContainer = {};
            yield this.copyLogsFromVMToHere(experiment.topology.structure);
            yield this.moveAndRenameVehicleSimulationLogs(experiment);
        });
    }
    copyLogsFromVMToHere(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[node.name]) {
                return;
            }
            this.visitedNode[node.name] = true;
            if (!this.visitedContainer[node.hostMachine.name]) {
                this.visitedContainer[node.hostMachine.name] = true;
                yield this.copyLogsFromVM(node);
                yield this.removeLogsFromVM(node);
                yield this.copyResultsFromVM(node);
                yield this.removeResultsFromVM(node);
            }
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                yield this.copyLogsFromVMToHere(peer);
            }
        });
    }
    copyLogsFromVM(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (node.nodeType != types_1.NodeType.VEHICLE_IOT) { // we have logs only in vehicles
                return;
            }
            this.logger.info(`====== Copying logs from ${node.hostMachine.name}`);
            let cmdCopyLog = `scp -r -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress}:~/logs/* vehicle_logs/`;
            try {
                yield this.commandExecutor.executeCommand(cmdCopyLog);
            }
            catch (e) { // if there is no log
                this.logger.info(e.name + ' ' + e.message);
            }
        });
    }
    copyResultsFromVM(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (node.nodeType != types_1.NodeType.VEHICLE_IOT) { // simulations are done only at vehicles
                return;
            }
            this.logger.info(`====== Copying simulation results from ${node.hostMachine.name}`);
            let cmdCopyResults = `scp -r -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress}:~/sim-results/* results/`;
            try {
                yield this.commandExecutor.executeCommand(cmdCopyResults);
            }
            catch (e) { // if there is no log
                this.logger.info(e.name + ' ' + e.message);
            }
        });
    }
    removeLogsFromVM(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (node.nodeType != types_1.NodeType.VEHICLE_IOT) { // we have logs only in vehicles
                return;
            }
            this.logger.info(`====== Removing logs in ${node.hostMachine.name}`);
            let cmdRemoveLogs = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'sudo rm -rf ~/logs'`;
            try {
                yield this.commandExecutor.executeCommand(cmdRemoveLogs); // if there is no log
            }
            catch (e) {
                this.logger.info(e.name + ' ' + e.message);
            }
        });
    }
    removeResultsFromVM(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (node.nodeType != types_1.NodeType.VEHICLE_IOT) { // simulations are done only at vehicles
                return;
            }
            this.logger.info(`====== Removing results in ${node.hostMachine.name}`);
            let cmdRemoveResults = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'sudo rm -rf ~/sim-results'`;
            try {
                yield this.commandExecutor.executeCommand(cmdRemoveResults); // if there is no log
            }
            catch (e) {
                this.logger.info(e.name + ' ' + e.message);
            }
        });
    }
}
exports.ResultsPuller = ResultsPuller;
//# sourceMappingURL=ResultsPuller.js.map