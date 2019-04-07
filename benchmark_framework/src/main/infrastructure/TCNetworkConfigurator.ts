import {Configuration, INetworkConfigurator, NetworkQuality, Node, Topology} from "../types";
import {Logger} from "log4js";
import {CommandExecutor} from "../util/CommandExecutor";


export class TCNetworkConfigurator implements INetworkConfigurator {


    private visitedNode = {};
    private visitedHost = {};

    public constructor(private logger: Logger, private commandExecutor: CommandExecutor, private config: Configuration) {

    }


    //TODO change the solution here, such that each connection can have different network properties

    public async setupNetworkQualityInTopology(topology: Topology) {

        this.visitedNode = {};
        this.visitedHost = {};

        let netQuality: NetworkQuality = null;

        let root: Node = topology.structure;

        if (root.connections && root.connections[0] && root.connections[0].netQuality) {
            netQuality = root.connections[0].netQuality;
        }

        await this.setupNetworkQualityInTopologyRec(root, netQuality);

    }

    private async setupNetworkQualityInTopologyRec(root: Node, netQuality: NetworkQuality) {

        if (this.visitedNode[root.name]) {
            return;
        }
        this.visitedNode[root.name] = true;

        if (!this.visitedHost[root.hostMachine.name]) {

            this.visitedHost[root.hostMachine.name] = true;

            if (netQuality) {

                this.logger.info(`>>> Setting network quality to ${netQuality.name} at ${root.hostMachine.name} at address ${root.hostMachine.ipAddress}`);

                let createInterfaceCmd = this.createNetworkInterfaceCommand(root.hostMachine.ipAddress);
                let setBandwidthCmd = this.createSetBandwidthCommand(root.hostMachine.ipAddress, netQuality);
                let setLatencyCmd = this.createSetLatencyCommand(root.hostMachine.ipAddress, netQuality);

                try {
                    await this.commandExecutor.executeCommand(createInterfaceCmd);
                    await this.commandExecutor.executeCommand(setBandwidthCmd);
                    await this.commandExecutor.executeCommand(setLatencyCmd);
                } catch (e) {
                    this.logger.info(e.name + ' ' + e.message);
                }
            }
        }

        for (let connection of root.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.setupNetworkQualityInTopologyRec(peer, netQuality);
        }
    }

    public async resetNetworkQualityInTopology(topology: Topology) {

        this.visitedNode = {};
        this.visitedHost = {};
        await this.resetNetworkQualityInTopologyRec(topology.structure);

    }

    private async resetNetworkQualityInTopologyRec(root: Node) {

        if (this.visitedNode[root.name]) {
            return;
        }

        this.visitedNode[root.name] = true;

        if (!this.visitedHost[root.hostMachine.name]) {

            this.visitedHost[root.hostMachine.name] = true;

            try {
                let resetCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${root.hostMachine.ipAddress} 'sudo tc qdisc del dev ens4 root'`;

                this.logger.info('>>> Reseting network configuration at ' + root.hostMachine.name);


                await this.commandExecutor.executeCommand(resetCmd);
            } catch (e) {
                this.logger.info('Exception when reset net config');
            }
        }


        for (let connection of root.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.resetNetworkQualityInTopologyRec(peer);
        }

    }

    private createNetworkInterfaceCommand(ipAddress: string): string {

        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'sudo tc qdisc add dev ens4 root handle 1: htb default 12'`;
        return command;
    }


    private createSetBandwidthCommand(ipAddress: string, quality: NetworkQuality): string {

        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'sudo tc class add dev ens4 parent 1:1 classid 1:12 htb rate ${quality.bandwidth} ceil ${quality.bandwidth}'`;
        return command;
    }

    private createSetLatencyCommand(ipAddress: string, quality: NetworkQuality): string {

        let command = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${ipAddress} 'sudo tc qdisc add dev ens4 parent 1:12 netem delay ${quality.latency}'`;
        return command;
    }

}