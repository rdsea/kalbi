import {Logger} from "log4js";
import {Topology, Node, HostMachine, Configuration} from "../types";
import {CommandExecutor} from "../util/CommandExecutor";


export class ArtefactsInstaller {

    private visitedNode = {};
    private visitedHost = {};

    constructor(private logger: Logger, private commandExecutor: CommandExecutor, private config: Configuration) {

    }


    public async installRequiredArtefacts(topology: Topology) {

        this.visitedHost = {};
        this.visitedNode = {};

        await this.installRequiredArtefactsRec(topology.structure);
    }

    private async installRequiredArtefactsRec(node: Node) {

        if (this.visitedNode[node.name]) {
            return;
        }

        this.visitedNode[node.name] = true;

        if (!this.visitedHost[node.hostMachine.ipAddress]) {
            await this.installArtefactsOnMachine(node.hostMachine);
            this.visitedHost[node.hostMachine.ipAddress] = true;
        }
        for (let connection of node.connections) {
            await this.installRequiredArtefactsRec(connection.connectionEndpoint);
        }

    }

    private async installArtefactsOnMachine(hostMachine: HostMachine) {
        this.logger.info(`====== Installing required artefacts on machine ${hostMachine.name} ======`);


        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostMachine.ipAddress} 'ls ~/prereqs-ubuntu.sh'`);
        } catch (e) {
            if (e.toString().indexOf('No such file')) {
                await this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} prereqs/prereqs-ubuntu.sh ${this.config.sshUsername}@${hostMachine.ipAddress}:~/`);
                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostMachine.ipAddress} 'chmod +x ~/prereqs-ubuntu.sh && ./prereqs-ubuntu.sh'`)

                this.logger.info('>>>>>>>>> Installation finished!');
                this.logger.info('>>>>>>>>> Pulling newest docker containers!');

                await this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} prereqs/install_containers.sh ${this.config.sshUsername}@${hostMachine.ipAddress}:~/`);
                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${hostMachine.ipAddress} 'chmod +x ~/install_containers.sh && ./install_containers.sh'`)

                this.logger.info('>>>>>>>>> Pull newest docker containers finished!');

                return;
            } else {
                throw e;
            }
        }
        this.logger.info('>>>>>>>>> Artefacts have been already installed!');
    }
}