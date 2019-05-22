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
class ArtefactsInstaller {
    constructor(logger, commandExecutor, config) {
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.config = config;
        this.visitedNode = {};
        this.visitedHost = {};
    }
    installRequiredArtefacts(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.visitedHost = {};
            this.visitedNode = {};
            yield this.installRequiredArtefactsRec(topology.structure);
        });
    }
    installRequiredArtefactsRec(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[node.name]) {
                return;
            }
            this.visitedNode[node.name] = true;
            if (!this.visitedHost[node.hostMachine.ipAddress]) {
                yield this.installArtefactsOnMachine(node.hostMachine);
                this.visitedHost[node.hostMachine.ipAddress] = true;
            }
            for (let connection of node.connections) {
                yield this.installRequiredArtefactsRec(connection.connectionEndpoint);
            }
        });
    }
    installArtefactsOnMachine(hostMachine) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`====== Installing required artefacts on machine ${hostMachine.name} ======`);
            try {
                yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostMachine.ipAddress} 'ls ~/prereqs-ubuntu.sh'`);
            }
            catch (e) {
                if (e.toString().indexOf('No such file')) {
                    yield this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} prereqs/prereqs-ubuntu.sh ${this.config.sshUsername}@${hostMachine.ipAddress}:~/`);
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostMachine.ipAddress} 'chmod +x ~/prereqs-ubuntu.sh && ./prereqs-ubuntu.sh'`);
                    this.logger.info('>>>>>>>>> Installation finished!');
                    this.logger.info('>>>>>>>>> Pulling newest docker containers!');
                    yield this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} prereqs/install_containers.sh ${this.config.sshUsername}@${hostMachine.ipAddress}:~/`);
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostMachine.ipAddress} 'chmod +x ~/install_containers.sh && ./install_containers.sh'`);
                    this.logger.info('>>>>>>>>> Pull newest docker containers finished!');
                    return;
                }
                else {
                    throw e;
                }
            }
            this.logger.info('>>>>>>>>> Artefacts have been already installed!');
        });
    }
}
exports.ArtefactsInstaller = ArtefactsInstaller;
//# sourceMappingURL=ArtefactsInstaller.js.map