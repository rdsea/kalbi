import {Logger} from "log4js";
import {
    Configuration,
    ExperimentsConfiguration,
    IV2XRunner,
    Node,
    NodesAtContainer,
    ResourceType,
    StringMap,
    Topology
} from "../../types";
import {CommandExecutor} from "../../util/CommandExecutor";
import * as fs from "fs";
import * as fse from "fs-extra"
import * as replacer from "replace-in-file"
import {EthTopologyUtils} from "./EthTopologyUtils";
import {EthereumSmartContractDeployer} from "./EthereumSmartContractDeployer";
import {AbsV2XRunner} from "../AbsV2XRunner";


export class V2XRunnerEthereum extends AbsV2XRunner implements IV2XRunner {


    private topologyUtils: EthTopologyUtils;

    constructor(logger: Logger,
                commandExecutor: CommandExecutor,
                config: Configuration,
                experimentConfig: ExperimentsConfiguration) {

        super(logger, commandExecutor, config, experimentConfig);


    }

    public async runV2XEnv(topology: Topology) {

        this.topologyUtils = new EthTopologyUtils(topology.structure);

        this.logger.info('======= Starting V2X Enviroment on Ethereum ======');
        this.logger.info('====== Starting the V2X Environment in Docker containers ======');

        let nodesInContainer: NodesAtContainer = this.topologyUtils.getNodesInContainer();

        for (let i = 0; i < this.topologyUtils.getContainers().length; i++) {

            let containerName: string = this.topologyUtils.getContainers()[i].hostMachine.name;
            let peers: Node[] = nodesInContainer[containerName];
            let hasVehicles: boolean = await this.buildVehicleSimulatorsInDockerCompose(peers, EthereumSmartContractDeployer.smartContractAddress);
            if (hasVehicles) {
                await this.dockerComposeUpBlockchainInContainer(peers);
            }
        }
    }

    private async buildVehicleSimulatorsInDockerCompose(peers: Node[], contractAddress): Promise<boolean> {

        let bcIPAddressesMap: StringMap = await this.obtainIPAddressesOfBlockchainContainers(peers);

        let dockerComposeFilename: string = `eth/v2x-compose/docker-compose-v2x-${peers[0].hostMachine.name}.yaml`;
        let dockerComposeHeader = `version: '2' \n\nnetworks:\n  eth:\n    external: true\n\n`;


        fs.appendFileSync(dockerComposeFilename, dockerComposeHeader);
        fs.appendFileSync(dockerComposeFilename, '\nservices:\n');

        let vehicles: number = 0;

        for (let i = 0; i < peers.length; i++) {
            let node: Node = peers[i];

            let bcIpAddress: string = bcIPAddressesMap[node.name];

            if (node.nodeType == ResourceType.VEHICLE_IOT) {
                this.addVehicleToDockerCompose(node, bcIpAddress, contractAddress, dockerComposeFilename);
                vehicles++;
            }
        }
        if (vehicles == 0) {
            fs.unlinkSync(dockerComposeFilename);
            return false;
        }
        return true;
    }

    private addVehicleToDockerCompose(node: Node, bcIpAddress: string, contractAddress: string, dockerComposeFilename: string) {

        fse.copyFileSync('eth/vehicle-compose-temp.yaml', 'eth/vehicle-compose.yaml');

        let vehicleComposeReplaceOptions = {
            files: 'eth/vehicle-compose.yaml',
            from: ['IMAGE_NAME', /VEHICLE_NAME/g, /VEHICLE_ID/g, 'ROUNDS_NR', 'BC_IP_ADDRESS', 'CONTRACT_ADDRESS'],
            to: [this.experimentConfiguration.workloadEmulator.imageTag, node.name, node.name, this.experimentConfiguration.roundsNr, bcIpAddress, contractAddress]
        };
        replacer.sync(vehicleComposeReplaceOptions);

        let vehicleComposeYaml = fs.readFileSync('eth/vehicle-compose.yaml');
        fs.appendFileSync(dockerComposeFilename, vehicleComposeYaml + '\n' + '\n');
        fs.unlinkSync('eth/vehicle-compose.yaml');
    }

    private async dockerComposeUpBlockchainInContainer(nodesAtContainer: Node[]) {

        this.logger.info(`>>> Moving docker-compose-v2x-${nodesAtContainer[0].hostMachine.name}.yaml to container ${nodesAtContainer[0].hostMachine.name}...`);

        await this.commandExecutor.executeCommand(`scp -i ${this.config.sshKeyPath} eth/v2x-compose/docker-compose-v2x-${nodesAtContainer[0].hostMachine.name}.yaml ${this.config.sshUsername}@${nodesAtContainer[0].hostMachine.ipAddress}:~/ethereum/`);

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

                this.logger.info(`>>>>>> Starting a subset of vehicles: ${containerNames}`);

                let cmd: string = `cd ethereum && COMPOSE_HTTP_TIMEOUT=1200 COMPOSE_PROJECT_NAME="" docker-compose -f docker-compose-v2x-${currentNode.hostMachine.name}.yaml up -d ${containerNames}`;
                await this.commandExecutor.executeCommand(`ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${currentNode.hostMachine.ipAddress} '${cmd}'`);

                containerNames = '';
                pageSize = 0;

                await this.sleep(5000);
            }
        }
    }

    public async killSimulationContainers(topology: Topology) {

        await this.commandExecutor.executeCommand('rm -rf eth/v2x-compose');
        await this.commandExecutor.executeCommand('mkdir eth/v2x-compose');

        this.topologyUtils = new EthTopologyUtils(topology.structure);

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

        let stopContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodesToKill[0].hostMachine.ipAddress} 'docker stop ${nodeNames}'`;
        let removeContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodesToKill[0].hostMachine.ipAddress} 'docker rm -f ${nodeNames}'`;

        try {
            await this.commandExecutor.executeCommand(stopContainerCmd);
            await this.commandExecutor.executeCommand(removeContainerCmd);
        } catch (e) {
            this.logger.info(e.name + ' ' + e.message);
        }

    }

    private async obtainIPAddressesOfBlockchainContainers(nodes: Node[]): Promise<StringMap> {

        let bcIPAddresses: StringMap = {};

        let containerNames: string = '';

        for (let node of nodes) {
            containerNames = containerNames + ` ${node.name}_bc`
        }

        let cmd: string = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${nodes[0].hostMachine.ipAddress} "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${containerNames}"`;

        let data = await this.commandExecutor.executeCommand(cmd);

        data = data.substring(0, data.length - 1); // cutting of the \n at the end

        let i: number = 0;

        data.toString().split('\n').forEach((bcIPAddress) => {
            bcIPAddresses[nodes[i].name] = bcIPAddress + ':8545';
            i++;
        });

        return bcIPAddresses;
    }


}