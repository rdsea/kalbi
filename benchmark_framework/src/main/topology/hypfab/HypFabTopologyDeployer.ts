import {
    BlockchainRole, Configuration,
    INetworkConfigurator,
    ITopologyDeployer,
    Node,
    NodesAtContainer,
    ResourceType,
    Topology
} from "../../types";
import {TCNetworkConfigurator} from "../../infrastructure/TCNetworkConfigurator";
import {Logger} from "log4js";
import {CommandExecutor} from "../../util/CommandExecutor";
import * as replacer from "replace-in-file"
import * as fse from "fs-extra"
import * as fs from 'file-system';
import {HypFabTopologyUtils} from "./HypFabTopologyUtils";
import {InfrastructureBuilder} from "../../infrastructure/InfrastructureBuilder";


export class HypFabTopologyDeployer implements ITopologyDeployer {


    private util: HypFabTopologyUtils;

    constructor(private networkConfig: INetworkConfigurator,
                private logger: Logger,
                private commandExecutor: CommandExecutor,
                private infrastructureBuilder: InfrastructureBuilder,
                private config: Configuration) {


    }

    async deployTopology(topology: Topology) {

        this.logger.info('============= DEPLOYING TOPOLOGY... =============');

        this.util = new HypFabTopologyUtils(topology.structure);


        this.logger.info('>>> Peers names: ' + this.util.getPeerNames());
        this.logger.info('>>> Orderers names: ' + this.util.getOrdererNames());

        this.logger.info('>>> Main Peer name: ' + this.util.getMainPeerName());
        this.logger.info('>>> Main Orderer name: ' + this.util.getMainOrdererName());

        await this.generateNetworkArtifacts();
        await this.moveArtifactsToAllHosts();

        let swarmLeader: Node = this.getSwarmLeader(topology.structure);

        let dockerSwarmJoinCommand = await this.initializeDockerSwarmAt(swarmLeader);
        await this.sleep(30000);// waiting till swarm is initialised

        await this.joinDockerSwarmRec(swarmLeader, dockerSwarmJoinCommand);

        await this.sleep(30000);// waiting till nodes join swarm

        await this.createOverlayNetwork(swarmLeader);

        await this.sleep(30000);// waiting till network is created

        await this.runDockerComposeKafka(swarmLeader);

        await this.sleep(10000);

        await this.runBlockchainInDocker(topology.structure);

        await this.runCliContainerToInstallAndInitChaincode(swarmLeader);

        this.logger.info('============= TOPOLOGY DEPLOYED =============');
        this.logger.info('====== Waiting 9 minutes till chaincode is installed and instantiated ======');

        await this.sleep(9 * 60 * 1000);
    }

    public async obtainNodeNamesOutOfSync(topology: Topology): Promise<string[]> {

        // it might happen that after the simulation some of the VMs are not responsive (because of their full utilization, mainly in weak networks and hardware)
        let notSyncedVMsNames: string[] = await this.infrastructureBuilder.restartNotResponsiveVMsOfTopology(topology.structure);
        let notSyncedNodeNames: string[] = this.obtainContainerNamesOfVMs(topology.structure, notSyncedVMsNames);

        return notSyncedNodeNames;
    }

    private obtainContainerNamesOfVMs(topology: Node, notSyncedVMsNames: string[]) {

        let restartedContainerNames: string[] = [];

        let visitedNode = {};
        let queue: Node[] = [];
        queue.push(topology);

        while (queue.length > 0) {
            let lastNode: Node = queue.pop();
            visitedNode[lastNode.name] = true;
            if (notSyncedVMsNames.indexOf(lastNode.hostMachine.name) > -1) {
                restartedContainerNames.push(lastNode.name);
                this.logger.info(`====== Node ${lastNode.name} in ${lastNode.hostMachine.name} is out of sync ======`);
            }
            for (let connection of lastNode.connections) {

                let peer: Node = connection.connectionEndpoint;

                if (visitedNode[peer.name]) {
                    continue;
                }
                queue.push(peer);
            }
        }
        return restartedContainerNames;
    }

    private async runDockerComposeKafka(leader: Node) {

        fse.copyFileSync('hyp-fab/docker-compose-kafka-ca-temp.yaml', 'hyp-fab/docker-compose-kafka-ca.yaml');

        let secret_key = this.getOrg1SecretKey();
        let dockerComposeReplaceOptions = {
            files: 'hyp-fab/docker-compose-kafka-ca.yaml',
            from: 'SECRET_KEY',
            to: secret_key
        };
        replacer.sync(dockerComposeReplaceOptions);


        this.logger.info(`=== Starting Kafka brokers in ${leader.hostMachine.name} ${leader.hostMachine.ipAddress} ===`);

        await this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} hyp-fab/docker-compose-kafka-ca.yaml ${this.config.sshUsername}@${leader.hostMachine.ipAddress}:~/hyperledger-fabric/`);

        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${leader.hostMachine.ipAddress} 'cd hyperledger-fabric && docker-compose -f docker-compose-kafka-ca.yaml up -d'`);
    }

    private getSwarmLeader(node: Node): Node {

        let swarmLeader: Node = null;

        if (node.nodeType == ResourceType.VEHICLE_IOT) {

            for (let connection of node.connections) {
                let peer: Node = connection.connectionEndpoint;
                if (peer.nodeType != ResourceType.VEHICLE_IOT) {
                    swarmLeader = peer;
                    break;
                }
            }

        } else {
            swarmLeader = node;
        }
        this.logger.info('=== Swarm leader is in ' + swarmLeader.hostMachine.name + '===');

        return swarmLeader;
    }



    private getOrg1SecretKey(): string {

        let name = '';
        fs.readdirSync('hyp-fab/crypto-config/peerOrganizations/org1.example.com/ca').forEach((filename) => {

            if (filename.indexOf('ca.org1.example.com') == -1) {// there are only two files in the dir, one is ca.org1.example.com-cert.pem the other is secret key
                name = filename;
                return;
            }

        });

        return name;
    }

    private async createOverlayNetwork(leader: Node) {

        this.logger.info(`=== Creating overlay network in ${leader.hostMachine.name} ${leader.hostMachine.ipAddress} ===`);
        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${leader.hostMachine.ipAddress} 'docker network create --attachable --driver overlay byfn'`);
    }

    private async runCliContainerToInstallAndInitChaincode(leader: Node) {

        fse.copyFileSync('hyp-fab/startCli-Temp.sh', 'hyp-fab/startCli.sh');

        let startPeerReplaceOptions = {
            files: 'hyp-fab/startCli.sh',
            from: /MAIN_PEER/g,
            to: this.util.getMainPeerName()
        };
        replacer.sync(startPeerReplaceOptions);


        this.logger.info(`>>> Running cli container in ${leader.hostMachine.ipAddress}...`);

        await this.commandExecutor.executeCommand(`scp -r -i ${this.config.sshKeyPath} hyp-fab/scripts ${this.config.sshUsername}@${leader.hostMachine.ipAddress}:~/hyperledger-fabric/`);
        await this.commandExecutor.executeCommand(`scp -r -i ${this.config.sshKeyPath} hyp-fab/chaincode ${this.config.sshUsername}@${leader.hostMachine.ipAddress}:~/hyperledger-fabric/`);
        await this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} hyp-fab/startCli.sh ${this.config.sshUsername}@${leader.hostMachine.ipAddress}:~/hyperledger-fabric/`);

        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${leader.hostMachine.ipAddress} 'cd hyperledger-fabric && ./startCli.sh'`);

    }

    private async runBlockchainInDocker(node: Node) {


        this.peerPort1 = 7051;
        this.peerPort2 = 7053;
        this.ordererPort = 7050;
        this.gossipPeer = null;

        this.logger.info('====== STARTING BLOCKCHAIN COMPONENTS IN DOCKER ======');

        for (let i = 0; i < this.util.getContainers().length; i++) {
            this.buildNodesDockerComposeForContainer(this.util.getContainers()[i]);
            await this.dockerComposeUpBlockchainInContainer(this.util.getContainers()[i]);
        }

        this.logger.info('====== BLOCKCHAIN COMPONENTS IN DOCKER ARE RUNNING ======');
    }

    private buildNodesDockerComposeForContainer(container: Node) {

        let dockerComposeFilename: string = `hyp-fab/bc-compose/docker-compose-bc-${container.hostMachine.name}.yaml`;

        let dockerComposeHeader = `version: '2' \n\nnetworks:\n  byfn:\n    external: true\n\n`;

        fs.appendFileSync(dockerComposeFilename, dockerComposeHeader);

        let hasVolumesKeyWord: boolean = false;

        for (let i = 0; i < this.util.getNodesInContainer()[container.hostMachine.name].length; i++) {

            let node: Node = this.util.getNodesInContainer()[container.hostMachine.name][i];

            if (node.blockchainArtefact.bcOperation == BlockchainRole.all || node.blockchainArtefact.bcOperation == BlockchainRole.creator) {

                if (!hasVolumesKeyWord) {
                    fs.appendFileSync(dockerComposeFilename, 'volumes:\n');
                    hasVolumesKeyWord = true;
                }
                fs.appendFileSync(dockerComposeFilename, `  ${node.name}_peer.org1.example.com:\n`);
            }

        }

        fs.appendFileSync(dockerComposeFilename, '\nservices:\n');

        for (let i = 0; i < this.util.getNodesInContainer()[container.hostMachine.name].length; i++) {

            let node: Node = this.util.getNodesInContainer()[container.hostMachine.name][i];

            if (node.blockchainArtefact.bcOperation == BlockchainRole.all) {

                this.addPeerToDockerCompose(node, dockerComposeFilename);
                this.addOrdererToDockerCompose(node, dockerComposeFilename);

            } else if (node.blockchainArtefact.bcOperation == BlockchainRole.creator) {

                this.addPeerToDockerCompose(node, dockerComposeFilename);

            } else if (node.blockchainArtefact.bcOperation == BlockchainRole.miner) {

                this.addOrdererToDockerCompose(node, dockerComposeFilename);

            }
        }
    }

    private async dockerComposeUpBlockchainInContainer(containerNode: Node) {

        this.logger.info(`>>> Moving docker-compose-bc-${containerNode.hostMachine.name}.yaml to container ${containerNode.hostMachine.name}...`);

        await this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} hyp-fab/bc-compose/docker-compose-bc-${containerNode.hostMachine.name}.yaml ${this.config.sshUsername}@${containerNode.hostMachine.ipAddress}:~/hyperledger-fabric/`);

        this.logger.info('>>> Starting containers....');

        // container nginx is used just to "wake up" the network on swarm workers
        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${containerNode.hostMachine.ipAddress} 'docker run -d --name nginx --net=byfn nginx'`);


        // paging of containers to run, because when running too many at one, it causes context deadline exceed error, when connecting to the overlay network
        let nodesInContainerMap: NodesAtContainer = this.util.getNodesInContainer();
        let nodesAtContainer: Node[] = nodesInContainerMap[containerNode.hostMachine.name];

        let containerBatchStartLimit: number = 10;
        let pageSize: number = 0;

        let containerNames: string = '';

        for (let i = 0; i < nodesAtContainer.length; i++) {

            let lastIterantion: boolean = (i == (nodesAtContainer.length - 1));

            let currentNode: Node = nodesAtContainer[i];

            if (currentNode.blockchainArtefact.bcOperation == BlockchainRole.all) {
                containerNames = containerNames + ` ${currentNode.name}_peer.org1.example.com`;
                containerNames = containerNames + ` ${currentNode.name}_orderer.example.com`;
                pageSize = pageSize + 2;
            } else if (currentNode.blockchainArtefact.bcOperation == BlockchainRole.creator) {
                containerNames = containerNames + ` ${currentNode.name}_peer.org1.example.com`;
                pageSize++;
            } else if (currentNode.blockchainArtefact.bcOperation == BlockchainRole.miner) {
                containerNames = containerNames + ` ${currentNode.name}_orderer.example.com`;
                pageSize++;
            }

            if (pageSize == containerBatchStartLimit || (lastIterantion && pageSize > 0)) {

                this.logger.info(`>>>>>> Starting a subset of containers: ${containerNames}`);

                let cmd: string = `cd hyperledger-fabric && COMPOSE_HTTP_TIMEOUT=1200 COMPOSE_PROJECT_NAME="" docker-compose -f docker-compose-bc-${containerNode.hostMachine.name}.yaml up -d ${containerNames}`;
                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${containerNode.hostMachine.ipAddress} '${cmd}'`);

                await this.sleep(5000);

                containerNames = '';
                pageSize = 0;
            }

        }

    }


    private peerPort1: number;
    private peerPort2: number;
    private gossipPeer: string;


    private addPeerToDockerCompose(peerNode: Node, dockerComposeFilename: string) {

        fse.copyFileSync('hyp-fab/peer-compose-temp.yaml', 'hyp-fab/peer-compose.yaml');

        let peerName: string = peerNode.name + '_peer.org1.example.com';

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

    private ordererPort: number;

    private addOrdererToDockerCompose(ordererNode: Node, dockerComposeFilename: string) {

        fse.copyFileSync('hyp-fab/orderer-compose-temp.yaml', 'hyp-fab/orderer-compose.yaml');

        let ordererName: string = ordererNode.name + '_orderer.example.com';

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

    private async initializeDockerSwarmAt(node: Node): Promise<string> {

        this.logger.info(`>>> Initializing docker swarm at ${node.hostMachine.name}...`);
        let data = await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} docker swarm init`);

        let beginIndex: number = data.indexOf('docker swarm join --token');
        let endIndex: number = data.lastIndexOf(':2377');

        data = data.substring(beginIndex, endIndex + 5);

        return data;
    }

    private async joinDockerSwarmRec(swarmLeader: Node, joinSwarmCmd: string) {

        let containerVMs: Node[] = this.util.getContainers();

        for (let containerVM of containerVMs) {

            if (containerVM.hostMachine.name.localeCompare(swarmLeader.hostMachine.name)) {

                this.logger.info(`>>> Container ${containerVM.hostMachine.name} is joining swarm as a worker using cmd: ${joinSwarmCmd}...`);

                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${containerVM.hostMachine.ipAddress} '${joinSwarmCmd}'`);
            }
        }
    }

    private async generateNetworkArtifacts() {

        this.logger.info('>>> Creating configuration files to generate network artifacts...');


        await this.commandExecutor.executeCommand('mkdir hyp-fab/channel-artifacts');

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


        let cryptoConfigReplacementOptionsToOrderers = this.createOrdererHostnamesForCryptoConfig( );
        let cryptoConfigReplacementOptionsToPeers = this.createPeerHostnamesForCryptoConfig( );

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
        let generatedDataOutput = await this.commandExecutor.executeCommand('cd hyp-fab && ./byfn.sh generate');

        this.logger.info(generatedDataOutput);

    }

    private buildReplacementPeerNames(): string {
        //("35.205.180.182" "23.251.129.198" "35.205.201.221")
        let peerNamesParsed = `("${this.util.getPeerNames()[0]}"`;

        for (let i = 1; i < this.util.getPeerNames().length; i++) {
            peerNamesParsed = peerNamesParsed + ` "${this.util.getPeerNames()[i]}"`;
        }

        peerNamesParsed = peerNamesParsed + ')';

        return peerNamesParsed;

    }


    private async moveArtifactsToAllHosts() {

        let vmContainers: Node[] = this.util.getContainers();

        for (let vmContainer of vmContainers) {

            this.logger.info(`>>> Moving generated network artifacts to ${vmContainer.hostMachine.ipAddress} ...`);
            await this.moveArtifactsToHost(vmContainer.hostMachine.ipAddress);


        }
    }

    private async moveArtifactsToHost(hostIpAddress: string) {

        let cmd = `rsync -avz -e "ssh -i ${this.config.sshKeyPath}" hyp-fab/channel-artifacts ${this.config.sshUsername}@${hostIpAddress}:~/hyperledger-fabric/`;
        await this.commandExecutor.executeCommand(cmd);

        cmd = `rsync -avz -e "ssh -i ${this.config.sshKeyPath}" hyp-fab/crypto-config ${this.config.sshUsername}@${hostIpAddress}:~/hyperledger-fabric/`;
        await this.commandExecutor.executeCommand(cmd);
    }

    private createOrdererAddressesForConfigTx(ordererNames: string[]): string {

        let ordererAddresses = `${ordererNames[0]}.example.com:7050\n`;
        for (let i = 1; i < ordererNames.length; i++) {
            ordererAddresses = ordererAddresses + `        - ${ordererNames[i]}.example.com:7050\n`;
        }

        return ordererAddresses;
    }

    private createPeerHostnamesForCryptoConfig( ): string {

        let peersHostnames = `${this.util.getPeerNames()[0]}\n`;
        for (let i = 1; i < this.util.getPeerNames().length; i++) {
            peersHostnames = peersHostnames + `      - Hostname: ${this.util.getPeerNames()[i]}\n`;
        }

        return peersHostnames;
    }

    private createOrdererHostnamesForCryptoConfig(): string {

        let ordererHostname = `${this.util.getOrdererNames()[0]}\n`;
        for (let i = 1; i < this.util.getOrdererNames().length; i++) {
            ordererHostname = ordererHostname + `      - Hostname: ${this.util.getOrdererNames()[i]}\n`;
        }

        return ordererHostname;
    }


    async deployNetworkQuality(topology: Topology) {

        this.logger.info('============= SETING NETWORK PROPERTIES... =============');
        await this.networkConfig.setupNetworkQualityInTopology(topology);
        this.logger.info('============= NETWORK PROPERTIES SET... =============');

    }



    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


}