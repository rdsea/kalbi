import {Logger} from "log4js";
import {CommandExecutor} from "../util/CommandExecutor";
import {Configuration, ExperimentsConfiguration, IV2XRunner, Node, NodeType, Topology} from "../types";


export abstract class AbsV2XRunner implements IV2XRunner{

    private finishedContainers: string[] = [];
    private visitedNode = {};
    private visitedHostMachine = {};

    private topologyNodeTypeNames = [];

    public constructor(protected logger: Logger,
                       protected commandExecutor: CommandExecutor,
                       protected config: Configuration,
                       protected experimentConfiguration: ExperimentsConfiguration) {

    }

    abstract killSimulationContainers(topology: Topology);
    abstract runV2XEnv(topology: Topology);

    public async isSimulationRunning(topology: Topology): Promise<boolean> {

        this.visitedNode = {};
        this.visitedHostMachine = {};
        
        let topologyVehicleNodeNames: string[] = this.obtainAllTopologyNodeTypeNames(topology.structure, NodeType.vehicle);

        this.visitedNode = {};
        this.visitedHostMachine = {};
        this.finishedContainers = [];

        await this.obtainFinishedDockerContainers(topology.structure);

        if (this.finishedContainers.length != topologyVehicleNodeNames.length) {
            return true;
        }

        for (let vehicleName of topologyVehicleNodeNames) {
            if (this.finishedContainers.indexOf(vehicleName) == -1) {
                return true;
            }
        }

        this.logger.info('====== All simulation containers have finished their jobs ======');
        await this.sleep(60000);

        return false;
    }

    private async obtainFinishedDockerContainers(node: Node) {

        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;

        if (!this.visitedHostMachine[node.hostMachine.ipAddress] && node.nodeType == NodeType.vehicle) {
            this.visitedHostMachine[node.hostMachine.ipAddress] = true;
            let stopedContainers: string[] = await this.obtainDockerFinishedContainersAtNode(node, 0);
            this.finishedContainers = this.finishedContainers.concat(stopedContainers);
        }

        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.obtainFinishedDockerContainers(peer);
        }
    }

    private async obtainDockerFinishedContainersAtNode(node: Node, retryNr: number): Promise<string[]> {

        let cmd = `ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=30 -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'cd ~/sim-results && ls'`;

        try {
            let data = await this.commandExecutor.executeCommand(cmd);
            data = data.substring(0, data.length - 1);

            let finishedContainerNames: string[] = [];
            data.toString().split('\n').forEach((filename) => {
                let containerName: string = filename.substring(0, filename.length - 5);
                finishedContainerNames.push(containerName);
            });
            return finishedContainerNames;

        } catch (e) {
            if (retryNr == 0) {
                throw e;
            }
            this.logger.info(`========= Exception ${e}, when obtaining finished containers, retrying in 2 seconds =========`);
            await this.sleep(2000);
            return await this.obtainDockerFinishedContainersAtNode(node, --retryNr);
        }
    }

    public obtainAllTopologyNodeTypeNames(topology: Node, nodeType: NodeType): string[] {

        this.visitedNode = {};
        this.topologyNodeTypeNames = [];
        this.obtainAllTopologyNodeTypeNamesRec(topology, nodeType);

        return this.topologyNodeTypeNames;
    }

    private obtainAllTopologyNodeTypeNamesRec(topology: Node, nodeType: NodeType) {

        if (this.visitedNode[topology.name]) {
            return;
        }

        this.visitedNode[topology.name] = true;

        if (topology.nodeType == nodeType) {
            this.topologyNodeTypeNames.push(topology.name);
        }

        for (let connection of topology.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.obtainAllTopologyNodeTypeNamesRec(peer, nodeType);
        }
    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
}