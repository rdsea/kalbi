import {Logger} from "log4js";
import {CommandExecutor} from "../util/CommandExecutor";
import {
    Configuration,
    HardwareUtilization,
    IResourceUtilizationObtainer,
    Node,
    Topology,
    UtilizationAtNodesMapWithKeys
} from "../types";
import {TopologyHelper} from "../topology/TopologyHelper";


export class DockerResourceUtilizationObtainer implements IResourceUtilizationObtainer {

    private visitedNode = {};
    private visitedHost = {};
    private utilizationMapWithKeys: UtilizationAtNodesMapWithKeys;


    public constructor(private logger: Logger,
                       private commandExecutor: CommandExecutor,
                       private topologyHelper: TopologyHelper,
                       private config: Configuration) {

    }

    public async obtainResourceUtilizationOfTopology(topology: Topology): Promise<UtilizationAtNodesMapWithKeys> {

        let nodeNamesOfTopology: string[] = this.topologyHelper.obtainAllTopologyNodeNames(topology.structure);

        this.visitedNode = {};
        this.visitedHost = {};
        this.utilizationMapWithKeys = {
            keys: [],
            utilizationMap: {}
        };

        this.logger.info('=== Obtaining utilization stats... ===');
        await this.obtainDockerStatsRec(topology.structure, nodeNamesOfTopology);
        this.logger.info('=== Utilization stats obtained ===');

        return this.utilizationMapWithKeys;
    }

    private async obtainDockerStatsRec(topology: Node, topologyNodeNames: string[]) {

        if (this.visitedNode[topology.name]) {
            return;
        }

        this.visitedNode[topology.name] = true;

        if (!this.visitedHost[topology.hostMachine.name]) {

            this.visitedHost[topology.hostMachine.name] = true;

            this.logger.info(`=== Obtaining utilization stats from ${topology.hostMachine.name} ===`);

            let dockerStatsCmd: string = `docker stats --no-stream`;
            let cmd: string = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${topology.hostMachine.ipAddress} '${dockerStatsCmd}'`;
            let utilizationStats: string = '';
            let data: string = ``;

            try {
                utilizationStats = await this.commandExecutor.executeCommandWithTimeout(cmd, 120 * 1000);
                data = `Utilization of container ${topology.hostMachine.name}: \n${utilizationStats} \n`;
            } catch (e) {
                data = `Utilization of container ${topology.hostMachine.name}: UTILIZATION REQUEST TIMED OUT \n`;
            }

            this.addUtilizationStatsToMap(data, topologyNodeNames);
        }

        for (let connection of topology.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.obtainDockerStatsRec(peer, topologyNodeNames);
        }
    }

    private addUtilizationStatsToMap(utilizationStats: string, topologyNodeNames: string[]) {

        let cpuBeginIndex: number;
        let ramBeginIndex: number;
        let nameBeginIndex: number;


        utilizationStats.split('\n').forEach((line) => {


            if (line.indexOf('CONTAINER ID') > -1 && line.indexOf('NAME') > -1) {

                cpuBeginIndex = line.indexOf('CPU %');
                ramBeginIndex = line.indexOf('MEM USAGE / LIMIT');
                nameBeginIndex = line.indexOf('NAME');

            } else {

                if (line.indexOf('Utilization of container') == -1) {

                    let nameEndIndex: number = line.indexOf(' ', nameBeginIndex);
                    let nameEndIndex2: number = line.indexOf('_', nameBeginIndex);

                    if (nameEndIndex2 > -1 && nameEndIndex > nameEndIndex2) {
                        nameEndIndex = nameEndIndex2;
                    }

                    try {
                        let nodeName: string = line.substring(nameBeginIndex, nameEndIndex);

                        if (topologyNodeNames.indexOf(nodeName) > -1) { // this is a valid node in our topology

                            let cpuEndIndex: number = line.substring(cpuBeginIndex).indexOf('%');
                            let cpuUtil: number = +line.substring(cpuBeginIndex, cpuBeginIndex + cpuEndIndex);

                            let ramEndIndex: number = line.substring(ramBeginIndex).indexOf('MiB');
                            let ramUtil: number = +line.substring(ramBeginIndex, ramBeginIndex + ramEndIndex);

                            if (this.utilizationMapWithKeys.utilizationMap[nodeName]) {

                                this.utilizationMapWithKeys.utilizationMap[nodeName].cpuUtil = this.utilizationMapWithKeys.utilizationMap[nodeName].cpuUtil + cpuUtil;
                                this.utilizationMapWithKeys.utilizationMap[nodeName].memoryUtil = this.utilizationMapWithKeys.utilizationMap[nodeName].memoryUtil + cpuUtil;

                            } else {
                                let hardwareUtil: HardwareUtilization = {
                                    name: 'Hardware utilization of ' + nodeName,
                                    description: 'Resources Consuption by ' + nodeName,
                                    cpuUtil: cpuUtil,
                                    memoryUtil: ramUtil,
                                    nodeRef: {
                                        name: nodeName
                                    }
                                };
                                this.utilizationMapWithKeys.utilizationMap[nodeName] = hardwareUtil;
                                this.utilizationMapWithKeys.keys.push(nodeName);
                            }

                        }

                    } catch (e) {

                    }

                }
            }
        });
    }


}