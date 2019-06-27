import {Configuration, ContainerConfiguration, HostMachine, ICloudVMService, Node, ResourceType, Topology} from "../types";
import {Logger} from "log4js";
import {CommandExecutor} from "../util/CommandExecutor";


export class InfrastructureBuilder {

    private visitedNode = {};
    private visitedHost = {};
    private notResponsiveVMsNames = [];

    constructor(private vmService: ICloudVMService,
                private logger: Logger,
                private commandExecutor: CommandExecutor,
                private config: Configuration) {

    }


    public async startMachinesOfTopology(topology: Topology): Promise<Topology> {

        this.logger.info('=== Starting machines of a topology ===');

        this.visitedNode = {};
        this.visitedHost = {};

        await this.startMachineOfNode(topology.structure);

        return topology;
    }

    private async startMachineOfNode(node: Node) {

        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;

        if (!node.hostMachine.ipAddress) { // if a node's host machine has an ip-address, it means we already have an available machine for the node.
            if (!this.visitedHost[node.hostMachine.name]) {
                let ipAddress: string = await this.vmService.startVM(node.hostMachine.name);
                node.hostMachine.ipAddress = ipAddress;
                this.visitedHost[node.hostMachine.name] = ipAddress;
            } else {
                node.hostMachine.ipAddress = this.visitedHost[node.hostMachine.name];
            }
        }


        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.startMachineOfNode(peer);
        }
    }

    public async stopMachinesOfTopology(topology: Topology): Promise<Topology> {
        this.logger.info('=== Stopping machines of a topology ===');

        this.visitedNode = {};
        this.visitedHost = {};

        await this.stopMachineOfNode(topology.structure);

        return topology;
    }

    private async stopMachineOfNode(node: Node) {

        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;

        if (!this.visitedHost[node.hostMachine.ipAddress]) {
            this.visitedHost[node.hostMachine.ipAddress] = true;

            try {
                await this.vmService.stopVM(node.hostMachine.name); // in case the hostMachine isn't a vm by the provider, then the VMService will generate an exception
            } catch (e) {

            }

        }
        for (let connection of node.connections) {
            await this.stopMachineOfNode(connection.connectionEndpoint);
        }
    }

    public async restartNotResponsiveVMsOfTopology(topology: Node): Promise<string[]> {
        this.visitedNode = {};
        this.visitedHost = {};
        this.notResponsiveVMsNames = [];
        await this.restartNotResponsiveVMsRec(topology);
        return this.notResponsiveVMsNames;

    }

    private async restartNotResponsiveVMsRec(topology: Node) {

        if (this.visitedNode[topology.name]) {
            return;
        }

        this.visitedNode[topology.name] = true;

        if (!this.visitedHost[topology.hostMachine.name]) {
            this.visitedHost[topology.hostMachine.name] = true;

            let isResponsive: boolean = await this.isVMResponsive(topology);

            if (!isResponsive) {
                await this.restartVM(topology);
                this.notResponsiveVMsNames.push(topology.name);
            }
        }

        for (let connection of topology.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.restartNotResponsiveVMsRec(peer);
        }
    }

    private async restartVM(vm: Node) {
        this.logger.info('Restarting VirtualMachine: ' + vm.hostMachine.name);
        await this.vmService.stopVM(vm.hostMachine.name);
        let ipAddress: string = await this.vmService.startVM(vm.hostMachine.name);

        vm.hostMachine.ipAddress = ipAddress;
    }


    public async createAndStartMachinesOfTopology(topology: Topology): Promise<Topology> {

        this.logger.info('=== Creating necessary virtual machines for a topology === ');

        let hostMachines: HostMachine[] = await this.vmService.findAvailableVMs();

        let vehContainerReqs: ContainerConfiguration = this.buildContainerRequirementsForNodeType(topology.structure, ResourceType.VEHICLE_IOT);
        let rsuContainerReqs: ContainerConfiguration = this.buildContainerRequirementsForNodeType(topology.structure, ResourceType.RSU_RESOURCE);
        let edgeContainerReqs: ContainerConfiguration = this.buildContainerRequirementsForNodeType(topology.structure, ResourceType.EDGE_SERVICE);
        let cloudContainerReqs: ContainerConfiguration = this.buildContainerRequirementsForNodeType(topology.structure, ResourceType.CLOUD_SERVICE);

        let veh, rsu, edge, cloud: boolean;

        for (let hostMachine of hostMachines) {
            if (!veh && this.equalRequirements(hostMachine.configuration, vehContainerReqs)) {
                this.logger.info(`>>> Virtual Machine ${hostMachine.name} will be reused for vehicles`);

                hostMachine.ipAddress = await this.vmService.startVM(hostMachine.name);

                this.updateHostMachinesInTopology(topology.structure, hostMachine, ResourceType.VEHICLE_IOT);
                veh = true;
            }
            else if (!rsu && this.equalRequirements(hostMachine.configuration, rsuContainerReqs)) {
                this.logger.info(`>>> Virtual Machine ${hostMachine.name} will be reused for rsus`);

                hostMachine.ipAddress = await this.vmService.startVM(hostMachine.name);

                this.updateHostMachinesInTopology(topology.structure, hostMachine, ResourceType.RSU_RESOURCE);
                rsu = true;
            }
            else if (!edge && this.equalRequirements(hostMachine.configuration, edgeContainerReqs)) {
                this.logger.info(`>>> Virtual Machine ${hostMachine.name} will be reused for edges`);

                hostMachine.ipAddress = await this.vmService.startVM(hostMachine.name);

                this.updateHostMachinesInTopology(topology.structure, hostMachine, ResourceType.EDGE_SERVICE);
                edge = true;
            }
            else if (!cloud && this.equalRequirements(hostMachine.configuration, cloudContainerReqs)) {
                this.logger.info(`>>> Virtual Machine ${hostMachine.name} will be reused for cloud`);

                hostMachine.ipAddress = await this.vmService.startVM(hostMachine.name);

                this.updateHostMachinesInTopology(topology.structure, hostMachine, ResourceType.CLOUD_SERVICE);
                cloud = true;
            }
        }
        if (vehContainerReqs && !veh) {
            this.logger.info('>>> Machine for vehicles need to be created');
            let machine: HostMachine = await this.vmService.createAndStartVM(vehContainerReqs, 'vehicle-fleet');
            this.updateHostMachinesInTopology(topology.structure, machine, ResourceType.VEHICLE_IOT);
        }
        if (rsuContainerReqs && !rsu) {
            this.logger.info('>>> Machine for rsus need to be created');
            let machine: HostMachine = await this.vmService.createAndStartVM(rsuContainerReqs, 'rsu-nodes');
            this.updateHostMachinesInTopology(topology.structure, machine, ResourceType.RSU_RESOURCE);
        }
        if (edgeContainerReqs && !edge) {
            this.logger.info('>>> Machine for edges need to be created');
            let machine: HostMachine = await this.vmService.createAndStartVM(edgeContainerReqs, 'edge-nodes');
            this.updateHostMachinesInTopology(topology.structure, machine, ResourceType.EDGE_SERVICE);
        }
        if (cloudContainerReqs && !cloud) {
            this.logger.info('>>> Machine for cloud need to be created');
            let machine: HostMachine = await this.vmService.createAndStartVM(cloudContainerReqs, ' cloud-nodes');
            this.updateHostMachinesInTopology(topology.structure, machine, ResourceType.CLOUD_SERVICE);
        }

        return topology;
    }

    private equalRequirements(contA: ContainerConfiguration, contB: ContainerConfiguration): boolean {

        if (!contA || !contB) {
            return false;
        }

        return contA.vCPUcount == contB.vCPUcount && contA.memory == contB.memory && contA.storageSSD == contB.storageSSD && contA.storageHDD == contB.storageHDD;
    }

    private updateHostMachinesInTopology(node: Node, host: HostMachine, nodeType: ResourceType) {
        this.visitedNode = {};
        this.updateHostMachinesInTopologyRec(node, host, nodeType);
    }

    private updateHostMachinesInTopologyRec(node: Node, host: HostMachine, nodeType: ResourceType) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;

        if (node.nodeType == nodeType && node.hostMachine.ipAddress == null) {
            node.hostMachine.ipAddress = host.ipAddress;
            node.hostMachine.name = host.name;
        }
        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.updateHostMachinesInTopologyRec(peer, host, nodeType);
        }
    }

    private containerRequirements: ContainerConfiguration;

    private buildContainerRequirementsForNodeType(node: Node, nodeType: ResourceType): ContainerConfiguration {
        this.visitedNode = {};

        this.containerRequirements = null;

        this.buildContainerRequirementsForNodeTypeRec(node, nodeType);
        return this.containerRequirements;
    }

    private buildContainerRequirementsForNodeTypeRec(node: Node, nodeType: ResourceType) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;

        if (node.nodeType == nodeType && node.hostMachine.ipAddress == null) { // build requirements, only for those machines, which dont have an ipaddress, these represent the ones we have to create in cloud
            if (this.containerRequirements) {
                this.containerRequirements.storageHDD = this.containerRequirements.storageHDD + node.hostMachine.configuration.storageHDD;
                this.containerRequirements.storageSSD = this.containerRequirements.storageSSD + node.hostMachine.configuration.storageSSD;

                this.containerRequirements.memory = this.containerRequirements.memory + node.hostMachine.configuration.memory;
                this.containerRequirements.vCPUcount = this.containerRequirements.vCPUcount + node.hostMachine.configuration.vCPUcount;
            } else {
                this.containerRequirements = {
                    os: node.hostMachine.configuration.os,
                    storageHDD: node.hostMachine.configuration.storageHDD,
                    storageSSD: node.hostMachine.configuration.storageSSD,
                    memory: node.hostMachine.configuration.memory,
                    vCPUcount: node.hostMachine.configuration.vCPUcount,
                    name: node.hostMachine.configuration.name,
                    provider: node.hostMachine.configuration.provider
                };
            }
        }

        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.buildContainerRequirementsForNodeTypeRec(peer, nodeType);
        }
    }


    private async isVMResponsive(container: Node): Promise<boolean> {
        this.logger.info(`>>>Checking if ${container.hostMachine.name} is responsive...`);
        let cmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${container.hostMachine.ipAddress} 'echo "I AM ALIVE"'`;
        try {
            await this.commandExecutor.executeCommandWithTimeout(cmd, 60 * 1000);
            return true;
        } catch (e) {
            return false;// this is most likely because of the timeout
        }
    }


}