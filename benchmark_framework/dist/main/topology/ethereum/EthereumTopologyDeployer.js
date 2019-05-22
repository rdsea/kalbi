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
class EthereumTopologyDeployer {
    constructor(networkConfig, logger, commandExecutor, ethSmartContractDeployer, infrastructureBuilder, config) {
        this.networkConfig = networkConfig;
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.ethSmartContractDeployer = ethSmartContractDeployer;
        this.infrastructureBuilder = infrastructureBuilder;
        this.config = config;
        this.visitedNode = {};
        this.visitedHost = {};
        this.gethNodesOutOfSyncNames = [];
        this.enodePortNr = 30303;
    }
    deployTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.visitedNode = {};
            this.visitedHost = {};
            this.enodePortNr = 30303;
            this.logger.info('============= DEPLOYING TOPOLOGY... =============');
            yield this.deployTopologyRec(topology.structure);
            this.logger.info('============= TOPOLOGY DEPLOYED... =============');
            this.visitedNode = {};
            this.logger.info('============= DEPLOYING BLOCKCHAIN FEATURES... =============');
            yield this.deployBlockchainFeatures(topology.structure);
            this.logger.info('============= BLOCKCHAIN FEATURES DEPLOYED... =============');
            this.logger.info('====== Waiting 15 minutes till DAG are generated ======');
            yield this.sleep(15 * 60 * 1000); //wait till DAG generation has finished
            yield this.ethSmartContractDeployer.deploySmartContract(topology.structure, 0);
        });
    }
    deployNetworkQuality(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('============= SETING NETWORK PROPERTIES... =============');
            yield this.networkConfig.setupNetworkQualityInTopology(topology);
            this.logger.info('============= NETWORK PROPERTIES SET... =============');
        });
    }
    deployTopologyRec(client) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[client.name]) {
                return client.enodeId;
            }
            this.visitedNode[client.name] = true;
            if (!this.visitedHost[client.hostMachine.ipAddress]) {
                this.visitedHost[client.hostMachine.ipAddress] = true;
                yield this.createBridgeNetworkInContainer(client);
            }
            this.logger.info('========= Node: ' + client.name + ' is starting in ' + client.hostMachine.name + '... =========');
            let enodePortNr = this.enodePortNr++;
            this.logger.info('>>>>>> Starting geth in docker');
            let dockerRun = this.createDockerGethRunCommand(client, enodePortNr);
            yield this.commandExecutor.executeCommand(dockerRun);
            yield this.sleep(1000); // waiting till geth is properly started
            this.logger.info('>>>>>> Creating peer account ');
            let dockerNewAccount = this.createDockerGethNewAccountCommand(client);
            yield this.commandExecutor.executeCommand(dockerNewAccount);
            // copying keystore data from docker container to host
            yield this.copyKeystoreFromDockerToHost(client);
            for (let connection of client.connections) {
                let peer = connection.connectionEndpoint;
                let peerEnodeId = yield this.deployTopologyRec(peer);
                peer.enodeId = peerEnodeId;
                this.logger.info('>>>>>>>>> Adding peer: ' + peer.name + ' to ' + client.name);
                let addPeerCmd = this.addPeerToNodeCmd(client, peerEnodeId);
                yield this.commandExecutor.executeCommand(addPeerCmd);
            }
            // get enodeid
            this.logger.info('>>>>>> Getting node enodeid...');
            let getEnodeIdCmd = this.createGetEnodeId(client);
            let enodeId = yield this.commandExecutor.executeCommand(getEnodeIdCmd);
            enodeId = enodeId.replace("127.0.0.1", client.hostMachine.ipAddress);
            enodeId = enodeId.replace(":30303", ':' + enodePortNr);
            this.logger.info('========= Peer ' + client.name + ' has been started and is running! =========');
            return enodeId;
        });
    }
    obtainNodeNamesOutOfSync(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.visitedNode = {};
            this.visitedHost = {};
            this.gethNodesOutOfSyncNames = [];
            // it might happen that after the simulation some of the VMs are not responsive (because of their full utilization, mainly in weak networks and hardware)
            yield this.infrastructureBuilder.restartNotResponsiveVMsOfTopology(topology.structure);
            yield this.obtainNotSyncedGethNodes(topology.structure);
            return this.gethNodesOutOfSyncNames;
        });
    }
    obtainNotSyncedGethNodes(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[node.name]) {
                return;
            }
            this.visitedNode[node.name] = true;
            if (node.connections.length == 0) {
                return;
            }
            let adminPeersCommand = this.createDockerGethAdminPeersCommand(node);
            let adminPeers = '';
            try {
                adminPeers = yield this.commandExecutor.executeCommand(adminPeersCommand);
            }
            catch (e) {
            }
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                let peerEnodeIdBegin = peer.enodeId.indexOf('enode');
                let peerEnodeIdEnd = peer.enodeId.indexOf('@');
                let peerEnodeId = peer.enodeId.substring(peerEnodeIdBegin, peerEnodeIdEnd);
                if (adminPeers.indexOf(peerEnodeId) == -1) {
                    this.gethNodesOutOfSyncNames.push(peer.name);
                    this.logger.info(`========= Blockchain node of ${peer.name} is not synced! =========`);
                }
                yield this.obtainNotSyncedGethNodes(peer);
            }
        });
    }
    createBridgeNetworkInContainer(container) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`=== Creating bridge network in ${container.hostMachine.name} at ${container.hostMachine.ipAddress} ===`);
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${container.hostMachine.ipAddress} 'docker network create --attachable eth'`);
        });
    }
    deployBlockchainFeatures(root) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[root.name]) {
                return;
            }
            this.visitedNode[root.name] = true;
            if (root.blockchainArtefact.bcOperation == types_1.BlockchainRole.all || root.blockchainArtefact.bcOperation == types_1.BlockchainRole.miner) {
                this.logger.info(`>>> Starting miner at ${root.name} at machine ${root.hostMachine.name}`);
                let startMinerCmd = this.createDockerGethStartMinerCommand(root);
                yield this.commandExecutor.executeCommand(startMinerCmd);
            }
            for (let connection of root.connections) {
                let peer = connection.connectionEndpoint;
                yield this.deployBlockchainFeatures(peer);
            }
        });
    }
    copyKeystoreFromDockerToHost(client) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'mkdir -p ~/ethereum/tmp-keystore/keystore'`);
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker cp ${client.name}_bc:/data/keystore/. ~/ethereum/tmp-keystore/keystore'`);
        });
    }
    createDockerGethRunCommand(client, enodePortNr) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker run -it -d -p ${enodePortNr}:30303 --network="eth" --name ${client.name}_bc --net-alias=${client.name}_bc filiprydzi/geth --rpc --rpcaddr 0.0.0.0 --rpcport 8545 --datadir /data --syncmode "full" --rpcapi="db,eth,net,web3,personal,web3" --txpool.pricelimit "0" --miner.gasprice "0" --maxpeers "80" --nodiscover --verbosity 4'`;
        return command;
    }
    createDockerGethNewAccountCommand(client) {
        let pwd = "\"123\"";
        pwd = this.addslashes(pwd);
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"personal.newAccount(${pwd})\" attach ipc://data/geth.ipc'`;
        return command;
    }
    createDockerGethStartMinerCommand(client) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"miner.start()\" attach ipc://data/geth.ipc'`;
        return command;
    }
    createDockerGethAdminPeersCommand(client) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"admin.peers\" attach ipc://data/geth.ipc'`;
        return command;
    }
    createGetEnodeId(client) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"admin.nodeInfo.enode\" attach ipc://data/geth.ipc'`;
        return command;
    }
    addPeerToNodeCmd(client, enodeId) {
        enodeId = this.addslashes(enodeId);
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"admin.addPeer(${enodeId})\" attach ipc://data/geth.ipc'`;
        this.logger.info('addding peer ' + command);
        return command;
    }
    addslashes(str) {
        return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.EthereumTopologyDeployer = EthereumTopologyDeployer;
//# sourceMappingURL=EthereumTopologyDeployer.js.map