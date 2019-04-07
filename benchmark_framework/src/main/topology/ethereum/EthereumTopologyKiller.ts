import {Configuration, INetworkConfigurator, ITopologyKiller, Node, Topology} from "../../types";
import {TCNetworkConfigurator} from "../../infrastructure/TCNetworkConfigurator";
import {Logger} from "log4js";
import {CommandExecutor} from "../../util/CommandExecutor";


export class EthereumTopologyKiller implements ITopologyKiller{

    private visitedNode = {};
    private visitedHost: {};

    constructor(private networkConfig: INetworkConfigurator,
                private logger: Logger,
                private commandExecutor: CommandExecutor,
                private config: Configuration) {
    }

    private force = false;

    /**
     * Removes all docker containers at Host (client.containerName).
     * @param client
     */
    private async killTopologyRec(client: Node) {

        if (this.visitedNode[client.name]) {
            return;
        }

        this.visitedNode[client.name] = true;

        if (!this.visitedHost[client.hostMachine.ipAddress]) {
            this.visitedHost[client.hostMachine.ipAddress] = true;
            try {
                await this.emptyEthereumFolderAtHost(client.hostMachine.ipAddress);
            } catch (e) {

            }

            let stopDockerContainers = this.createStopDockerContainersCmd(client.hostMachine.ipAddress);
            let removeDockerContainers = this.createRemoveDockerContainersCmd(client.hostMachine.ipAddress);

            try {
                this.logger.info('>>>>>> Stoping and removing containers in machine ' + client.hostMachine.ipAddress);

                await this.commandExecutor.executeCommand(stopDockerContainers);
                await this.commandExecutor.executeCommand(removeDockerContainers);

            } catch (e) {
                this.logger.info('Error at killing containers ' + e.message);
            }

            try {
                this.logger.info('>>>>>> Removing eth network in ' + client.hostMachine.name);
                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'docker network rm eth'`);
            } catch (e) {
                 this.logger.info('Error when removing bridge network ' + e.message);
            }

            try {
                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'sudo rm -rf ~/logs'`);
            } catch (e) {

            }
            try {
                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${client.hostMachine.ipAddress} 'sudo rm -rf ~/sim-results'`);
            } catch (e) {

            }

            if (this.force) {
                let removeDockerGethImage = this.createRemoveDockerImagesCmd(client.hostMachine.ipAddress);
                try {
                    this.logger.info('>>>>>> Removing filiprydzi/geth image...');
                    await this.commandExecutor.executeCommand(removeDockerGethImage);
                } catch (e) {

                }
            }
        }

        for (let connection of client.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.killTopologyRec(peer);
        }
    }

    private async emptyEthereumFolderAtHost(hostIpAddress: string) {

        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} sudo rm -rf ~/ethereum`);
        await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostIpAddress} 'mkdir ~/ethereum'`);

    }

    public async killTopology(topology: Topology) {

        await this.resetNetworkQuality(topology);

        this.logger.info('============= KILLING TOPOLOGY... =============');

        this.visitedNode = {};
        this.visitedHost = {};
        await this.killTopologyRec(topology.structure);

        this.logger.info('============= TOPOLOGY KILLED... =============');
    }

    async resetNetworkQuality(topology: Topology) {

        this.logger.info('============= RESETING NETWORK PROPERTIES... =============');
        await this.networkConfig.resetNetworkQualityInTopology(topology);
        this.logger.info('============= NETWORK PROPERTIES RESET... =============');

    }

    private createStopDockerContainersCmd(ipAddress: string) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'docker stop $(docker ps -a -q)'`;
        return command;
    }

    private createRemoveDockerContainersCmd(ipAddress: string) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'docker rm -f $(docker ps -a -q)'`;
        return command;
    }

    private createRemoveDockerImagesCmd(ipAddress: string) {
        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'docker rmi filiprydzi/geth'`;
        return command;
    }
    
}