import {
    Configuration,
    ExperimentsConfiguration,
    IV2XRunner,
    Node,
    NodesAtContainer,
    ResourceType,
    Topology
} from "../../types";
import {Logger} from "log4js";
import {CommandExecutor} from "../../util/CommandExecutor";
import {HypFabTopologyUtils} from "./HypFabTopologyUtils";
import * as replacer from "replace-in-file"
import * as fs from "fs";
import * as fse from "fs-extra"
import {AbsV2XRunner} from "../AbsV2XRunner";


export class V2XRunnerHypFab extends AbsV2XRunner implements IV2XRunner {


    private topologyUtils: HypFabTopologyUtils;

    constructor(logger: Logger,
                commandExecutor: CommandExecutor,
                config: Configuration,
                experimentConfiguration: ExperimentsConfiguration) {

        super(logger, commandExecutor, config, experimentConfiguration);

    }


    async runV2XEnv(topology: Topology) {

        this.logger.info('======= Starting V2X Enviroment on Hyperledger fabric ======');

        this.topologyUtils = new HypFabTopologyUtils(topology.structure);

        let nodesInContainer: NodesAtContainer = this.topologyUtils.getNodesInContainer();

        for (let i = 0; i < this.topologyUtils.getContainers().length; i++) {

            let containerName: string = this.topologyUtils.getContainers()[i].hostMachine.name;

            let peers: Node[] = nodesInContainer[containerName];

            let hasVehicles: boolean = this.buildVehicleSimulatorsInDockerCompose(peers);

            if (hasVehicles) {
                await this.dockerComposeUpBlockchainInContainer(peers);
            }
        }
    }

    private buildVehicleSimulatorsInDockerCompose(peers: Node[]): boolean {

        let dockerComposeFilename: string = `hyp-fab/v2x-compose/docker-compose-v2x-${peers[0].hostMachine.name}.yaml`;

        let dockerComposeHeader = `version: '2' \n\nnetworks:\n  byfn:\n    external: true\n\n`;

        fs.appendFileSync(dockerComposeFilename, dockerComposeHeader);
        fs.appendFileSync(dockerComposeFilename, '\nservices:\n');

        let vehicles: number = 0;

        for (let i = 0; i < peers.length; i++) {

            let node: Node = peers[i];

            if (node.nodeType == ResourceType.VEHICLE_IOT) {
                this.addVehicleToDockerCompose(node, dockerComposeFilename);
                vehicles++;
            }
        }

        if (vehicles == 0) {
            fs.unlinkSync(dockerComposeFilename);
            return false;
        }

        return true;
    }

    private addVehicleToDockerCompose(node: Node, dockerComposeFilename: string) {

        fse.copyFileSync('hyp-fab/vehicle-compose-temp.yaml', 'hyp-fab/vehicle-compose.yaml');

        let vehicleComposeReplaceOptions = {
            files: 'hyp-fab/vehicle-compose.yaml',
            from: ['IMAGE_NAME', /VEHICLE_NAME/g, /VEHICLE_ID/g, 'ROUNDS_NR', 'MAIN_ORDERER_NAME'],
            to: [this.experimentConfiguration.workloadEmulator.imageTag, node.name, node.name, this.experimentConfiguration.roundsNr, this.topologyUtils.getMainOrdererName()]
        };

        replacer.sync(vehicleComposeReplaceOptions);


        let vehicleComposeYaml = fs.readFileSync('hyp-fab/vehicle-compose.yaml');

        fs.appendFileSync(dockerComposeFilename, vehicleComposeYaml + '\n' + '\n');

        fs.unlinkSync('hyp-fab/vehicle-compose.yaml');
    }

    private async dockerComposeUpBlockchainInContainer(nodesAtContainer: Node[]) {

        this.logger.info(`>>> Moving docker-compose-v2x-${nodesAtContainer[0].hostMachine.name}.yaml to container ${nodesAtContainer[0].hostMachine.name}...`);

        await this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} hyp-fab/v2x-compose/docker-compose-v2x-${nodesAtContainer[0].hostMachine.name}.yaml ${this.config.sshUsername}@${nodesAtContainer[0].hostMachine.ipAddress}:~/hyperledger-fabric/`);

        this.logger.info('>>> Starting vehicles....');


        // paging of containers to run, because when running too many at one, it causes context deadline exceed error, when connecting to the overlay network

        let containerBatchStartLimit: number = 10;
        let pageSize: number = 0;

        let containerNames: string = '';

        for (let i = 0; i < nodesAtContainer.length; i++) {

            let lastIterantion: boolean = (i == (nodesAtContainer.length - 1));

            let currentNode: Node = nodesAtContainer[i];

            if (currentNode.nodeType == ResourceType.VEHICLE_IOT) {
                containerNames = containerNames + ` ${currentNode.name}`;
                pageSize++;
            }
            if (pageSize == containerBatchStartLimit || (lastIterantion && pageSize > 0)) {

                this.logger.info(`>>>>>> Starting a subset of vehicle: ${containerNames}`);

                let cmd: string = `cd hyperledger-fabric && COMPOSE_HTTP_TIMEOUT=1200 COMPOSE_PROJECT_NAME="" docker-compose -f docker-compose-v2x-${currentNode.hostMachine.name}.yaml up -d ${containerNames}`;
                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${currentNode.hostMachine.ipAddress} '${cmd}'`);

                await this.sleep(5000);

                containerNames = '';
                pageSize = 0;
            }
        }
    }

    public async killSimulationContainers(topology: Topology) {

        await this.commandExecutor.executeCommand('rm -rf hyp-fab/v2x-compose');
        await this.commandExecutor.executeCommand('mkdir hyp-fab/v2x-compose');

        this.topologyUtils = new HypFabTopologyUtils(topology.structure);

        this.logger.info('====== Killing old docker containers used during simulation ======');

        for (let i = 0; i < this.topologyUtils.getContainers().length; i++) {

            let containerNode: Node = this.topologyUtils.getContainers()[i];

            let peers: Node[] = this.topologyUtils.getNodesInContainer()[containerNode.hostMachine.name];

            await this.killSimulationNodesAtContainer(peers);
        }
    }

    private async killSimulationNodesAtContainer(nodesToKill: Node[]) {

        let nodeNames = nodesToKill[0].name;

        for (let i = 1; i < nodesToKill.length; i++) {
            nodeNames = nodeNames + ' ' + nodesToKill[i].name;
        }

        // container nginx is used just to "wake up" the network on swarm workers
        try {
            await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodesToKill[0].hostMachine.ipAddress} 'docker stop nginx && docker rm nginx'`);
        } catch (e) {

        }

        let stopContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodesToKill[0].hostMachine.ipAddress} 'docker stop ${nodeNames}'`;
        let removeContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodesToKill[0].hostMachine.ipAddress} 'docker rm -f ${nodeNames}'`;

        try {
            await this.commandExecutor.executeCommand(stopContainerCmd);
            await this.commandExecutor.executeCommand(removeContainerCmd);
        } catch (e) {
            this.logger.info(e.name + ' ' + e.message);
        }

    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


}