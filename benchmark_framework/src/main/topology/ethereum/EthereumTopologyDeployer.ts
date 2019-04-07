import {BlockchainRole, Configuration, INetworkConfigurator, ITopologyDeployer, Node, Topology} from "../../types";
import {TCNetworkConfigurator} from "../../infrastructure/TCNetworkConfigurator";
import {Logger} from "log4js";
import {CommandExecutor} from "../../util/CommandExecutor";
import {EthereumSmartContractDeployer} from "./EthereumSmartContractDeployer";
import {InfrastructureBuilder} from "../../infrastructure/InfrastructureBuilder";

export class EthereumTopologyDeployer implements ITopologyDeployer {


    private visitedNode = {};
    private visitedHost = {};

    private gethNodesOutOfSyncNames: string[] = [];

    constructor(private networkConfig: INetworkConfigurator,
                private logger: Logger,
                private commandExecutor: CommandExecutor,
                private ethSmartContractDeployer: EthereumSmartContractDeployer,
                private infrastructureBuilder: InfrastructureBuilder,
                private config: Configuration) {
    }


    public async deployTopology(topology: Topology) {

        this.visitedNode = {};
        this.visitedHost = {};
        this.enodePortNr = 30303;
        this.logger.info('============= DEPLOYING TOPOLOGY... =============');
        await this.deployTopologyRec(topology.structure);
        this.logger.info('============= TOPOLOGY DEPLOYED... =============');

        this.visitedNode = {};
        this.logger.info('============= DEPLOYING BLOCKCHAIN FEATURES... =============');
        await this.deployBlockchainFeatures(topology.structure);
        this.logger.info('============= BLOCKCHAIN FEATURES DEPLOYED... =============');

        this.logger.info('====== Waiting 15 minutes till DAG are generated ======');
        await this.sleep(15 * 60 * 1000); //wait till DAG generation has finished

        await this.ethSmartContractDeployer.deploySmartContract(topology.structure, 0);
    }

    async deployNetworkQuality(topology: Topology) {

        this.logger.info('============= SETING NETWORK PROPERTIES... =============');
        await this.networkConfig.setupNetworkQualityInTopology(topology);
        this.logger.info('============= NETWORK PROPERTIES SET... =============');
    }

    private enodePortNr = 30303;


    private async deployTopologyRec(client: Node): Promise<string> {

        if (this.visitedNode[client.name]) {
            return client.enodeId;
        }
        this.visitedNode[client.name] = true;

        if (!this.visitedHost[client.hostMachine.ipAddress]) {
            this.visitedHost[client.hostMachine.ipAddress] = true;
            await this.createBridgeNetworkInContainer(client);
        }

        this.logger.info('========= Node: ' + client.name + ' is starting in ' + client.hostMachine.name + '... =========');

        let enodePortNr = this.enodePortNr++;

        this.logger.info('>>>>>> Starting geth in docker');
        let dockerRun = this.createDockerGethRunCommand(client, enodePortNr);
        await this.commandExecutor.executeCommand(dockerRun);

        await this.sleep(1000); // waiting till geth is properly started

        this.logger.info('>>>>>> Creating peer account ');
        let dockerNewAccount = this.createDockerGethNewAccountCommand(client);
        await this.commandExecutor.executeCommand(dockerNewAccount);

        // copying keystore data from docker container to host
        await this.copyKeystoreFromDockerToHost(client);

        for (let connection of client.connections) {
            let peer: Node = connection.connectionEndpoint;
            let peerEnodeId = await this.deployTopologyRec(peer);
            peer.enodeId = peerEnodeId;

            this.logger.info('>>>>>>>>> Adding peer: ' + peer.name + ' to ' + client.name);

            let addPeerCmd = this.addPeerToNodeCmd(client, peerEnodeId);
            await this.commandExecutor.executeCommand(addPeerCmd);
        }
        // get enodeid
        this.logger.info('>>>>>> Getting node enodeid...');
        let getEnodeIdCmd = this.createGetEnodeId(client);
        let enodeId = await this.commandExecutor.executeCommand(getEnodeIdCmd);

        enodeId = enodeId.replace("127.0.0.1", client.hostMachine.ipAddress);
        enodeId = enodeId.replace(":30303", ':' + enodePortNr);

        this.logger.info('========= Peer ' + client.name + ' has been started and is running! =========');

        return enodeId;
    }

    public async obtainNodeNamesOutOfSync(topology: Topology): Promise<string[]> {

        this.visitedNode = {};
        this.visitedHost = {};
        this.gethNodesOutOfSyncNames = [];

        // it might happen that after the simulation some of the VMs are not responsive (because of their full utilization, mainly in weak networks and hardware)
        await this.infrastructureBuilder.restartNotResponsiveVMsOfTopology(topology.structure);
        await this.obtainNotSyncedGethNodes(topology.structure);

        return this.gethNodesOutOfSyncNames;
    }

    private async obtainNotSyncedGethNodes(node: Node) {

        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;

        if (node.connections.length == 0) {
            return;
        }

        let adminPeersCommand: string = this.createDockerGethAdminPeersCommand(node);
        let adminPeers: string = '';
        try {
            adminPeers = await this.commandExecutor.executeCommand(adminPeersCommand);
        } catch (e) {
        }

        for (let connection of node.connections) {

            let peer: Node = connection.connectionEndpoint;

            let peerEnodeIdBegin: number = peer.enodeId.indexOf('enode');
            let peerEnodeIdEnd: number = peer.enodeId.indexOf('@');
            let peerEnodeId: string = peer.enodeId.substring(peerEnodeIdBegin, peerEnodeIdEnd);

            if (adminPeers.indexOf(peerEnodeId) == -1) {
                this.gethNodesOutOfSyncNames.push(peer.name);
                this.logger.info(`========= Blockchain node of ${peer.name} is not synced! =========`);
            }
            await this.obtainNotSyncedGethNodes(peer);
        }
    }


    private async createBridgeNetworkInContainer(container: Node) {

        this.logger.info(`=== Creating bridge network in ${container.hostMachine.name} at ${container.hostMachine.ipAddress} ===`);
        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${container.hostMachine.ipAddress} 'docker network create --attachable eth'`);
    }

    private async deployBlockchainFeatures(root: Node): Promise<string> {
        if (this.visitedNode[root.name]) {
            return;
        }
        this.visitedNode[root.name] = true;

        if (root.blockchainArtefact.bcOperation == BlockchainRole.all || root.blockchainArtefact.bcOperation == BlockchainRole.miner) {
            this.logger.info(`>>> Starting miner at ${root.name} at machine ${root.hostMachine.name}`);
            let startMinerCmd = this.createDockerGethStartMinerCommand(root);
            await this.commandExecutor.executeCommand(startMinerCmd);
        }

        for (let connection of root.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.deployBlockchainFeatures(peer);
        }
    }

    private async copyKeystoreFromDockerToHost(client: Node) {

        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'mkdir -p ~/ethereum/tmp-keystore/keystore'`);
        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker cp ${client.name}_bc:/data/keystore/. ~/ethereum/tmp-keystore/keystore'`);

    }

    private createDockerGethRunCommand(client: Node, enodePortNr: number): string {

        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker run -it -d -p ${enodePortNr}:30303 --network="eth" --name ${client.name}_bc --net-alias=${client.name}_bc filiprydzi/geth --rpc --rpcaddr 0.0.0.0 --rpcport 8545 --datadir /data --syncmode "full" --rpcapi="db,eth,net,web3,personal,web3" --txpool.pricelimit "0" --miner.gasprice "0" --maxpeers "80" --nodiscover --verbosity 4'`;
        return command;

    }

    private createDockerGethNewAccountCommand(client: Node): string {

        let pwd = "\"123\"";
        pwd = this.addslashes(pwd);
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"personal.newAccount(${pwd})\" attach ipc://data/geth.ipc'`;

        return command;
    }


    private createDockerGethStartMinerCommand(client: Node): string {

        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"miner.start()\" attach ipc://data/geth.ipc'`;
        return command;
    }

    private createDockerGethAdminPeersCommand(client: Node): string {

        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"admin.peers\" attach ipc://data/geth.ipc'`;
        return command;
    }

    private createGetEnodeId(client: Node): string {

        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"admin.nodeInfo.enode\" attach ipc://data/geth.ipc'`;
        return command;
    }

    private addPeerToNodeCmd(client: Node, enodeId: string): string {

        enodeId = this.addslashes(enodeId);
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker exec -i ${client.name}_bc geth --exec \"admin.addPeer(${enodeId})\" attach ipc://data/geth.ipc'`;

        this.logger.info('addding peer ' + command);

        return command;
    }

    private addslashes(str) {
        return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


}