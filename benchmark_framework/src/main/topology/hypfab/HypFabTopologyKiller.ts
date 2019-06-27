import {Configuration, INetworkConfigurator, ITopologyKiller, Node, ResourceType, Topology} from "../../types";
import {TCNetworkConfigurator} from "../../infrastructure/TCNetworkConfigurator";
import {Logger} from "log4js";
import {CommandExecutor} from "../../util/CommandExecutor";
import * as fs from 'file-system';
import {HypFabTopologyUtils} from "./HypFabTopologyUtils";



export class HypFabTopologyKiller implements ITopologyKiller{


    private visitedNode = {};
    private visitedHost: {};

    private topologyUtils: HypFabTopologyUtils;

    constructor(private networkConfig: INetworkConfigurator,
                private logger: Logger,
                private commandExecutor: CommandExecutor,
                private config: Configuration) {


    }

    async killTopology(topology: Topology) {

        this.logger.info('====== KILLING OLD TOPOLOGY ======');

        this.topologyUtils = new HypFabTopologyUtils(topology.structure);

        await this.resetNetworkQuality(topology);

        this.logger.info('>>> Cleaning local directories, removing files...');

        try {
            fs.unlinkSync('hyp-fab/configtx.yaml');
        } catch (e) {

        }
        try {
            fs.unlinkSync('hyp-fab/crypto-config.yaml');
        } catch (e) {

        }

        try {
            fs.unlinkSync('hyp-fab/startPeer.sh');
        } catch (e) {

        }

        try {
            fs.unlinkSync('hyp-fab/startOrderer.sh');
        } catch (e) {

        }

        try {
            fs.unlinkSync('hyp-fab/startCli.sh');
        } catch (e) {

        }

        try {
            fs.unlinkSync('hyp-fab/docker-compose-kafka-ca.yaml');
        } catch (e) {

        }

        try {
            fs.unlinkSync('hyp-fab/scripts/script.sh');
        } catch (e) {

        }

        await this.commandExecutor.executeCommand('rm -rf hyp-fab/crypto-config');
        await this.commandExecutor.executeCommand('rm -rf hyp-fab/channel-artifacts');

        await this.commandExecutor.executeCommand('rm -rf hyp-fab/bc-compose');
        await this.commandExecutor.executeCommand('mkdir hyp-fab/bc-compose');

        await this.commandExecutor.executeCommand('rm -rf hyp-fab/v2x-compose');
        await this.commandExecutor.executeCommand('mkdir hyp-fab/v2x-compose');

        this.visitedNode = {};
        this.visitedHost = {};
        await this.stopAndRemoveDockerContainersRec(topology.structure);

        let swarmLeader = this.getSwarmLeader(topology.structure);

        this.logger.info(`>>> Retrieved swarm leader ${swarmLeader.name} is going to be killed as last...`);

        for (let i = 0; i < this.topologyUtils.getContainers().length; i++) {

            let container: Node = this.topologyUtils.getContainers()[i];

            if (container.name.localeCompare(swarmLeader.name)) {

                this.logger.info(`>>> ${container.hostMachine.name} is leaving docker swarm...`);

                await this.setWorkerAvailabilityToDrain(container, swarmLeader.hostMachine.ipAddress);
                await this.setWorkerAvailabilityToActive(container, swarmLeader.hostMachine.ipAddress);
                await this.removeNodeFromTheSwarm(container);
                await this.setWorkerAvailabilityToDrain(container, swarmLeader.hostMachine.ipAddress);
                await this.removeWorkerNodeOnMaster(container, swarmLeader.hostMachine.ipAddress);

            }

        }

        this.logger.info(`>>> ${swarmLeader.hostMachine.name} is leaving docker swarm...`);
        await this.removeNodeFromTheSwarm(swarmLeader);

        this.logger.info('====== OLD TOPOLOGY KILLED ======');
    }

    private getSwarmLeader(node: Node): Node {

        let swarmLeader: Node = null;

        if (node.resourceType == ResourceType.VEHICLE_IOT) {

            for (let connection of node.connections) {
                let peer: Node = connection.connectionEndpoint;
                if (peer.resourceType != ResourceType.VEHICLE_IOT) {
                    swarmLeader = peer;
                    break;
                }
            }

        } else {
            swarmLeader = node;
        }

        return swarmLeader;

    }

    private async removeHfcKeyStoreFolderOfVehicleNode(hostIpAddress: string, nodeName: string) {

        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} 'sudo rm -rf ~/hfc-key-store${nodeName}'`);
    }

    private async stopAndRemoveDockerContainersRec(node: Node) {

        if (this.visitedNode[node.name]) {
            return;
        }

        this.visitedNode[node.name] = true;

        if (node.resourceType == ResourceType.VEHICLE_IOT) {
            try {
                await this.removeHfcKeyStoreFolderOfVehicleNode(node.hostMachine.ipAddress, node.name);
            } catch (e) {

            }
        }

        if (!this.visitedHost[node.hostMachine.name]) {
            this.visitedHost[node.hostMachine.name] = true;
            await this.stopAndRemoveContainersAtNode(node);
        }

        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.stopAndRemoveDockerContainersRec(peer);
        }
    }

    private async stopAndRemoveContainersAtNode(node: Node) {

        this.logger.info(`>>> Stoping and removing containers in ${node.hostMachine.name}`);

        await this.emptyHyperledgerFabricFolderAtHost(node.hostMachine.ipAddress);

        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker stop $(docker ps -a -q)'`);
        } catch (e) {

        }
        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker rm -f $(docker ps -a -q)'`);
        } catch (e) {

        }
        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker volume rm $(docker volume ls -q)'`);
        } catch (e) {

        }
        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'sudo rm -rf ~/logs'`);
        } catch (e) {

        }
        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'sudo rm -rf ~/sim-results'`);
        } catch (e) {

        }
    }

    private async emptyHyperledgerFabricFolderAtHost(hostIpAddress: string) {

        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} 'sudo rm -rf ~/hyperledger-fabric'`);
        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} 'mkdir ~/hyperledger-fabric'`);

    }

    private async setWorkerAvailabilityToDrain(workerNode: Node, swarmLeaderAddress: string) {

        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${swarmLeaderAddress} 'docker node update --availability drain ${workerNode.hostMachine.name}'`);
        } catch (e) {
            this.logger.info('>>>>>> Error when setting worker avail to drain...' + e.message);
        }

    }

    private async setWorkerAvailabilityToActive(workerNode: Node, swarmLeaderAddress: string) {

        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${swarmLeaderAddress} 'docker node update --availability active ${workerNode.hostMachine.name}'`);
        } catch (e) {
            this.logger.info('>>>>>> Error when setting worker avail to drain...' + e.message);
        }

    }

    private async removeNodeFromTheSwarm(node: Node) {

        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker swarm leave -f'`);
        } catch (e) {
            this.logger.info('>>>>>> Error when leaving docker swarm...' + e.message);
        }

    }

    private async removeWorkerNodeOnMaster(workerNode: Node, swarmLeaderAddress: string) {

        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${swarmLeaderAddress} 'docker node rm ${workerNode.hostMachine.name}'`);
        } catch (e) {
            this.logger.info('>>>>>> Error when removing node...' + e.message);
        }

    }

    async resetNetworkQuality(topology: Topology) {

        this.logger.info('============= RESETING NETWORK PROPERTIES... =============');
        await this.networkConfig.resetNetworkQualityInTopology(topology);
        this.logger.info('============= NETWORK PROPERTIES RESET... =============');

    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}