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
const replacer = require("replace-in-file");
const fse = require("fs-extra");
const fs = require("file-system");
const HypFabTopologyUtils_1 = require("./HypFabTopologyUtils");
class HypFabTopologyDeployer {
    constructor(networkConfig, logger, commandExecutor, infrastructureBuilder, config) {
        this.networkConfig = networkConfig;
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.infrastructureBuilder = infrastructureBuilder;
        this.config = config;
    }
    deployTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('============= DEPLOYING TOPOLOGY... =============');
            this.util = new HypFabTopologyUtils_1.HypFabTopologyUtils(topology.structure);
            this.logger.info('>>> Peers names: ' + this.util.getPeerNames());
            this.logger.info('>>> Orderers names: ' + this.util.getOrdererNames());
            this.logger.info('>>> Main Peer name: ' + this.util.getMainPeerName());
            this.logger.info('>>> Main Orderer name: ' + this.util.getMainOrdererName());
            yield this.generateNetworkArtifacts();
            yield this.moveArtifactsToAllHosts();
            let swarmLeader = this.getSwarmLeader(topology.structure);
            let dockerSwarmJoinCommand = yield this.initializeDockerSwarmAt(swarmLeader);
            yield this.sleep(30000); // waiting till swarm is initialised
            yield this.joinDockerSwarmRec(swarmLeader, dockerSwarmJoinCommand);
            yield this.sleep(30000); // waiting till nodes join swarm
            yield this.createOverlayNetwork(swarmLeader);
            yield this.sleep(30000); // waiting till network is created
            yield this.runDockerComposeKafka(swarmLeader);
            yield this.sleep(10000);
            yield this.runBlockchainInDocker(topology.structure);
            yield this.runCliContainerToInstallAndInitChaincode(swarmLeader);
            this.logger.info('============= TOPOLOGY DEPLOYED =============');
            this.logger.info('====== Waiting 9 minutes till chaincode is installed and instantiated ======');
            yield this.sleep(9 * 60 * 1000);
        });
    }
    obtainNodeNamesOutOfSync(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            // it might happen that after the simulation some of the VMs are not responsive (because of their full utilization, mainly in weak networks and hardware)
            let notSyncedVMsNames = yield this.infrastructureBuilder.restartNotResponsiveVMsOfTopology(topology.structure);
            let notSyncedNodeNames = this.obtainContainerNamesOfVMs(topology.structure, notSyncedVMsNames);
            return notSyncedNodeNames;
        });
    }
    obtainContainerNamesOfVMs(topology, notSyncedVMsNames) {
        let restartedContainerNames = [];
        let visitedNode = {};
        let queue = [];
        queue.push(topology);
        while (queue.length > 0) {
            let lastNode = queue.pop();
            visitedNode[lastNode.name] = true;
            if (notSyncedVMsNames.indexOf(lastNode.hostMachine.name) > -1) {
                restartedContainerNames.push(lastNode.name);
                this.logger.info(`====== Node ${lastNode.name} in ${lastNode.hostMachine.name} is out of sync ======`);
            }
            for (let connection of lastNode.connections) {
                let peer = connection.connectionEndpoint;
                if (visitedNode[peer.name]) {
                    continue;
                }
                queue.push(peer);
            }
        }
        return restartedContainerNames;
    }
    runDockerComposeKafka(leader) {
        return __awaiter(this, void 0, void 0, function* () {
            fse.copyFileSync('hyp-fab/docker-compose-kafka-ca-temp.yaml', 'hyp-fab/docker-compose-kafka-ca.yaml');
            let secret_key = this.getOrg1SecretKey();
            let dockerComposeReplaceOptions = {
                files: 'hyp-fab/docker-compose-kafka-ca.yaml',
                from: 'SECRET_KEY',
                to: secret_key
            };
            replacer.sync(dockerComposeReplaceOptions);
            this.logger.info(`=== Starting Kafka brokers in ${leader.hostMachine.name} ${leader.hostMachine.ipAddress} ===`);
            yield this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} hyp-fab/docker-compose-kafka-ca.yaml ${this.config.sshUsername}@${leader.hostMachine.ipAddress}:~/hyperledger-fabric/`);
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${leader.hostMachine.ipAddress} 'cd hyperledger-fabric && docker-compose -f docker-compose-kafka-ca.yaml up -d'`);
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
        this.logger.info('=== Swarm leader is in ' + swarmLeader.hostMachine.name + '===');
        return swarmLeader;
    }
    getOrg1SecretKey() {
        let name = '';
        fs.readdirSync('hyp-fab/crypto-config/peerOrganizations/org1.example.com/ca').forEach((filename) => {
            if (filename.indexOf('ca.org1.example.com') == -1) { // there are only two files in the dir, one is ca.org1.example.com-cert.pem the other is secret key
                name = filename;
                return;
            }
        });
        return name;
    }
    createOverlayNetwork(leader) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`=== Creating overlay network in ${leader.hostMachine.name} ${leader.hostMachine.ipAddress} ===`);
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${leader.hostMachine.ipAddress} 'docker network create --attachable --driver overlay byfn'`);
        });
    }
    runCliContainerToInstallAndInitChaincode(leader) {
        return __awaiter(this, void 0, void 0, function* () {
            fse.copyFileSync('hyp-fab/startCli-Temp.sh', 'hyp-fab/startCli.sh');
            let startPeerReplaceOptions = {
                files: 'hyp-fab/startCli.sh',
                from: /MAIN_PEER/g,
                to: this.util.getMainPeerName()
            };
            replacer.sync(startPeerReplaceOptions);
            this.logger.info(`>>> Running cli container in ${leader.hostMachine.ipAddress}...`);
            yield this.commandExecutor.executeCommand(`scp -r -i ${this.config.sshKeyPath} hyp-fab/scripts ${this.config.sshUsername}@${leader.hostMachine.ipAddress}:~/hyperledger-fabric/`);
            yield this.commandExecutor.executeCommand(`scp -r -i ${this.config.sshKeyPath} hyp-fab/chaincode ${this.config.sshUsername}@${leader.hostMachine.ipAddress}:~/hyperledger-fabric/`);
            yield this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} hyp-fab/startCli.sh ${this.config.sshUsername}@${leader.hostMachine.ipAddress}:~/hyperledger-fabric/`);
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${leader.hostMachine.ipAddress} 'cd hyperledger-fabric && ./startCli.sh'`);
        });
    }
    runBlockchainInDocker(node) {
        return __awaiter(this, void 0, void 0, function* () {
            this.peerPort1 = 7051;
            this.peerPort2 = 7053;
            this.ordererPort = 7050;
            this.gossipPeer = null;
            this.logger.info('====== STARTING BLOCKCHAIN COMPONENTS IN DOCKER ======');
            for (let i = 0; i < this.util.getContainers().length; i++) {
                this.buildNodesDockerComposeForContainer(this.util.getContainers()[i]);
                yield this.dockerComposeUpBlockchainInContainer(this.util.getContainers()[i]);
            }
            this.logger.info('====== BLOCKCHAIN COMPONENTS IN DOCKER ARE RUNNING ======');
        });
    }
    buildNodesDockerComposeForContainer(container) {
        let dockerComposeFilename = `hyp-fab/bc-compose/docker-compose-bc-${container.hostMachine.name}.yaml`;
        let dockerComposeHeader = `version: '2' \n\nnetworks:\n  byfn:\n    external: true\n\n`;
        fs.appendFileSync(dockerComposeFilename, dockerComposeHeader);
        let hasVolumesKeyWord = false;
        for (let i = 0; i < this.util.getNodesInContainer()[container.hostMachine.name].length; i++) {
            let node = this.util.getNodesInContainer()[container.hostMachine.name][i];
            if (node.blockchainArtefact.bcOperation == types_1.BlockchainRole.all || node.blockchainArtefact.bcOperation == types_1.BlockchainRole.creator) {
                if (!hasVolumesKeyWord) {
                    fs.appendFileSync(dockerComposeFilename, 'volumes:\n');
                    hasVolumesKeyWord = true;
                }
                fs.appendFileSync(dockerComposeFilename, `  ${node.name}_peer.org1.example.com:\n`);
            }
        }
        fs.appendFileSync(dockerComposeFilename, '\nservices:\n');
        for (let i = 0; i < this.util.getNodesInContainer()[container.hostMachine.name].length; i++) {
            let node = this.util.getNodesInContainer()[container.hostMachine.name][i];
            if (node.blockchainArtefact.bcOperation == types_1.BlockchainRole.all) {
                this.addPeerToDockerCompose(node, dockerComposeFilename);
                this.addOrdererToDockerCompose(node, dockerComposeFilename);
            }
            else if (node.blockchainArtefact.bcOperation == types_1.BlockchainRole.creator) {
                this.addPeerToDockerCompose(node, dockerComposeFilename);
            }
            else if (node.blockchainArtefact.bcOperation == types_1.BlockchainRole.miner) {
                this.addOrdererToDockerCompose(node, dockerComposeFilename);
            }
        }
    }
    dockerComposeUpBlockchainInContainer(containerNode) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`>>> Moving docker-compose-bc-${containerNode.hostMachine.name}.yaml to container ${containerNode.hostMachine.name}...`);
            yield this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} hyp-fab/bc-compose/docker-compose-bc-${containerNode.hostMachine.name}.yaml ${this.config.sshUsername}@${containerNode.hostMachine.ipAddress}:~/hyperledger-fabric/`);
            this.logger.info('>>> Starting containers....');
            // container nginx is used just to "wake up" the network on swarm workers
            yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${containerNode.hostMachine.ipAddress} 'docker run -d --name nginx --net=byfn nginx'`);
            // paging of containers to run, because when running too many at one, it causes context deadline exceed error, when connecting to the overlay network
            let nodesInContainerMap = this.util.getNodesInContainer();
            let nodesAtContainer = nodesInContainerMap[containerNode.hostMachine.name];
            let containerBatchStartLimit = 10;
            let pageSize = 0;
            let containerNames = '';
            for (let i = 0; i < nodesAtContainer.length; i++) {
                let lastIterantion = (i == (nodesAtContainer.length - 1));
                let currentNode = nodesAtContainer[i];
                if (currentNode.blockchainArtefact.bcOperation == types_1.BlockchainRole.all) {
                    containerNames = containerNames + ` ${currentNode.name}_peer.org1.example.com`;
                    containerNames = containerNames + ` ${currentNode.name}_orderer.example.com`;
                    pageSize = pageSize + 2;
                }
                else if (currentNode.blockchainArtefact.bcOperation == types_1.BlockchainRole.creator) {
                    containerNames = containerNames + ` ${currentNode.name}_peer.org1.example.com`;
                    pageSize++;
                }
                else if (currentNode.blockchainArtefact.bcOperation == types_1.BlockchainRole.miner) {
                    containerNames = containerNames + ` ${currentNode.name}_orderer.example.com`;
                    pageSize++;
                }
                if (pageSize == containerBatchStartLimit || (lastIterantion && pageSize > 0)) {
                    this.logger.info(`>>>>>> Starting a subset of containers: ${containerNames}`);
                    let cmd = `cd hyperledger-fabric && COMPOSE_HTTP_TIMEOUT=1200 COMPOSE_PROJECT_NAME="" docker-compose -f docker-compose-bc-${containerNode.hostMachine.name}.yaml up -d ${containerNames}`;
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${containerNode.hostMachine.ipAddress} '${cmd}'`);
                    yield this.sleep(5000);
                    containerNames = '';
                    pageSize = 0;
                }
            }
        });
    }
    addPeerToDockerCompose(peerNode, dockerComposeFilename) {
        fse.copyFileSync('hyp-fab/peer-compose-temp.yaml', 'hyp-fab/peer-compose.yaml');
        let peerName = peerNode.name + '_peer.org1.example.com';
        if (!this.gossipPeer) {
            this.gossipPeer = peerName;
        }
        let peerComposeReplaceOptions = {
            files: 'hyp-fab/peer-compose.yaml',
            from: [/PEER_NAME/g, 'GOSSIP_PEER', 'PORT1', 'PORT2'],
            to: [peerName, this.gossipPeer, this.peerPort1, this.peerPort2]
        };
        replacer.sync(peerComposeReplaceOptions);
        let peerComposeYaml = fs.readFileSync('hyp-fab/peer-compose.yaml');
        fs.appendFileSync(dockerComposeFilename, peerComposeYaml + '\n' + '\n');
        fs.unlinkSync('hyp-fab/peer-compose.yaml');
        this.gossipPeer = peerName;
        this.peerPort1 = this.peerPort1 + 1000;
        this.peerPort2 = this.peerPort2 + 1000;
    }
    addOrdererToDockerCompose(ordererNode, dockerComposeFilename) {
        fse.copyFileSync('hyp-fab/orderer-compose-temp.yaml', 'hyp-fab/orderer-compose.yaml');
        let ordererName = ordererNode.name + '_orderer.example.com';
        let ordererComposeReplaceOptions = {
            files: 'hyp-fab/orderer-compose.yaml',
            from: [/ORDERER_ID/g, 'PORT'],
            to: [ordererName, this.ordererPort]
        };
        replacer.sync(ordererComposeReplaceOptions);
        let ordererComposeYaml = fs.readFileSync('hyp-fab/orderer-compose.yaml');
        fs.appendFileSync(dockerComposeFilename, ordererComposeYaml + '\n' + '\n');
        fs.unlinkSync('hyp-fab/orderer-compose.yaml');
        this.ordererPort = this.ordererPort + 1000;
    }
    initializeDockerSwarmAt(node) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`>>> Initializing docker swarm at ${node.hostMachine.name}...`);
            let data = yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} docker swarm init`);
            let beginIndex = data.indexOf('docker swarm join --token');
            let endIndex = data.lastIndexOf(':2377');
            data = data.substring(beginIndex, endIndex + 5);
            return data;
        });
    }
    joinDockerSwarmRec(swarmLeader, joinSwarmCmd) {
        return __awaiter(this, void 0, void 0, function* () {
            let containerVMs = this.util.getContainers();
            for (let containerVM of containerVMs) {
                if (containerVM.hostMachine.name.localeCompare(swarmLeader.hostMachine.name)) {
                    this.logger.info(`>>> Container ${containerVM.hostMachine.name} is joining swarm as a worker using cmd: ${joinSwarmCmd}...`);
                    yield this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${containerVM.hostMachine.ipAddress} '${joinSwarmCmd}'`);
                }
            }
        });
    }
    generateNetworkArtifacts() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('>>> Creating configuration files to generate network artifacts...');
            yield this.commandExecutor.executeCommand('mkdir hyp-fab/channel-artifacts');
            fse.copyFileSync('hyp-fab/scripts/script-temp.sh', 'hyp-fab/scripts/script.sh');
            fse.copyFileSync('hyp-fab/configtx-temp.yaml', 'hyp-fab/configtx.yaml');
            fse.copyFileSync('hyp-fab/crypto-config-temp.yaml', 'hyp-fab/crypto-config.yaml');
            let configTxReplaceOptionsTo = this.createOrdererAddressesForConfigTx(this.util.getOrdererNames());
            let configTxReplaceOptions = {
                files: 'hyp-fab/configtx.yaml',
                from: ['ORDERER_ADDRESSES', 'MAIN_PEER'],
                to: [configTxReplaceOptionsTo, this.util.getMainPeerName()]
            };
            replacer.sync(configTxReplaceOptions);
            let cryptoConfigReplacementOptionsToOrderers = this.createOrdererHostnamesForCryptoConfig();
            let cryptoConfigReplacementOptionsToPeers = this.createPeerHostnamesForCryptoConfig();
            let cryptoConfigReplaceOptions = {
                files: 'hyp-fab/crypto-config.yaml',
                from: ['ORDERER_HOSTNAME', 'PEERS_HOSTNAME', 'USERSCOUNT'],
                to: [cryptoConfigReplacementOptionsToOrderers, cryptoConfigReplacementOptionsToPeers, this.util.getPeerNames().length]
            };
            replacer.sync(cryptoConfigReplaceOptions);
            let initScriptReplacementToPeerNames = this.buildReplacementPeerNames();
            let initScriptReplacementOptions = {
                files: 'hyp-fab/scripts/script.sh',
                from: [/PEER_MAIN/g, /ORDERER_MAIN/g, /PEER_NAMES/g],
                to: [this.util.getMainPeerName(), this.util.getMainOrdererName(), initScriptReplacementToPeerNames]
            };
            replacer.sync(initScriptReplacementOptions);
            this.logger.info('>>> Executing script to generate artifacts...');
            let generatedDataOutput = yield this.commandExecutor.executeCommand('cd hyp-fab && ./byfn.sh generate');
            this.logger.info(generatedDataOutput);
        });
    }
    buildReplacementPeerNames() {
        //("35.205.180.182" "23.251.129.198" "35.205.201.221")
        let peerNamesParsed = `("${this.util.getPeerNames()[0]}"`;
        for (let i = 1; i < this.util.getPeerNames().length; i++) {
            peerNamesParsed = peerNamesParsed + ` "${this.util.getPeerNames()[i]}"`;
        }
        peerNamesParsed = peerNamesParsed + ')';
        return peerNamesParsed;
    }
    moveArtifactsToAllHosts() {
        return __awaiter(this, void 0, void 0, function* () {
            let vmContainers = this.util.getContainers();
            for (let vmContainer of vmContainers) {
                this.logger.info(`>>> Moving generated network artifacts to ${vmContainer.hostMachine.ipAddress} ...`);
                yield this.moveArtifactsToHost(vmContainer.hostMachine.ipAddress);
            }
        });
    }
    moveArtifactsToHost(hostIpAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = `rsync -avz -e "ssh -i ${this.config.sshKeyPath}" hyp-fab/channel-artifacts ${this.config.sshUsername}@${hostIpAddress}:~/hyperledger-fabric/`;
            yield this.commandExecutor.executeCommand(cmd);
            cmd = `rsync -avz -e "ssh -i ${this.config.sshKeyPath}" hyp-fab/crypto-config ${this.config.sshUsername}@${hostIpAddress}:~/hyperledger-fabric/`;
            yield this.commandExecutor.executeCommand(cmd);
        });
    }
    createOrdererAddressesForConfigTx(ordererNames) {
        let ordererAddresses = `${ordererNames[0]}.example.com:7050\n`;
        for (let i = 1; i < ordererNames.length; i++) {
            ordererAddresses = ordererAddresses + `        - ${ordererNames[i]}.example.com:7050\n`;
        }
        return ordererAddresses;
    }
    createPeerHostnamesForCryptoConfig() {
        let peersHostnames = `${this.util.getPeerNames()[0]}\n`;
        for (let i = 1; i < this.util.getPeerNames().length; i++) {
            peersHostnames = peersHostnames + `      - Hostname: ${this.util.getPeerNames()[i]}\n`;
        }
        return peersHostnames;
    }
    createOrdererHostnamesForCryptoConfig() {
        let ordererHostname = `${this.util.getOrdererNames()[0]}\n`;
        for (let i = 1; i < this.util.getOrdererNames().length; i++) {
            ordererHostname = ordererHostname + `      - Hostname: ${this.util.getOrdererNames()[i]}\n`;
        }
        return ordererHostname;
    }
    deployNetworkQuality(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('============= SETING NETWORK PROPERTIES... =============');
            yield this.networkConfig.setupNetworkQualityInTopology(topology);
            this.logger.info('============= NETWORK PROPERTIES SET... =============');
        });
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.HypFabTopologyDeployer = HypFabTopologyDeployer;
//# sourceMappingURL=HypFabTopologyDeployer.js.map