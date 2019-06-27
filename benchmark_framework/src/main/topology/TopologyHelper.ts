import {
    BlockchainArtefact,
    BlockchainImpl,
    ContainerConfiguration,
    NetworkQuality,
    Node,
    ResourceType,
    Topology
} from "../types";
import {Logger} from "log4js";


export class TopologyHelper {

    private visitedNode: {};
    private visitedHostMachine: {};

    private nodeNamesOfTopology: string[];


    constructor(private logger: Logger) {

    }

    public updateBlockchainArtefactInNodeType(node: Node, bcArtefact: BlockchainArtefact, nodeType: ResourceType) {

        this.visitedNode = {};
        this.visitedHostMachine = {};
        this.updateBlockchainArtefactInNodeTypeRec(node, bcArtefact, nodeType);
    }

    private updateBlockchainArtefactInNodeTypeRec(node: Node, bcArtefact: BlockchainArtefact, nodeType: ResourceType) {

        if (this.visitedNode[node.name]) {
            return;
        }

        this.visitedNode[node.name] = true;

        if (node.resourceType == nodeType) {
            node.blockchainArtefact = bcArtefact;
        }

        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.updateBlockchainArtefactInNodeTypeRec(peer, bcArtefact, nodeType);
        }
    }


    public updateTopologyMachineType(topology: Node, vehicleContainerConfig: ContainerConfiguration) {

        this.logger.info('====== Updating vehicle machines to ' + JSON.stringify(vehicleContainerConfig, null, 4) + ' ======');

        this.visitedNode = {};
        this.updateTopologyMachineTypeRec(topology, vehicleContainerConfig);
    }

    private updateTopologyMachineTypeRec(topology: Node, vehicleContainerConfig: ContainerConfiguration) {

        if (this.visitedNode[topology.name]) {
            return;
        }

        this.visitedNode[topology.name] = true;

        if (topology.resourceType == ResourceType.VEHICLE_IOT) {

            topology.hostMachine.ipAddress = null;
            topology.hostMachine.name = null;

            topology.hostMachine.configuration = vehicleContainerConfig;
        }

        for (let connection of topology.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.updateTopologyMachineTypeRec(peer, vehicleContainerConfig);
        }
    }


    public updateTopologyNetworkQuality(topology: Node, netQuality: NetworkQuality) {

        this.logger.info('====== Updating network quality to ' + netQuality.name + ' ======');

        this.visitedNode = {};
        this.updateTopologyNetworkQualityRec(topology, netQuality);
    }

    private updateTopologyNetworkQualityRec(topology: Node, netQuality: NetworkQuality) {

        if (this.visitedNode[topology.name]) {
            return;
        }
        this.visitedNode[topology.name] = true;

        for (let connection of topology.connections) {

            connection.netQuality = netQuality;
            let peer: Node = connection.connectionEndpoint;
            this.updateTopologyNetworkQualityRec(peer, netQuality);
        }
    }


    public obtainAllTopologyNodeNames(topology: Node): string[] {

        this.visitedNode = {};
        this.nodeNamesOfTopology = [];
        this.obtainAllTopologyNodeNamesRec(topology);
        return this.nodeNamesOfTopology;
    }

    private obtainAllTopologyNodeNamesRec(topology: Node) {
        if (this.visitedNode[topology.name]) {
            return;
        }
        this.visitedNode[topology.name] = true;
        this.nodeNamesOfTopology.push(topology.name);

        for (let connection of topology.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.obtainAllTopologyNodeNamesRec(peer);
        }
    }


    public returnUsedBlockchainImpl(topology: Topology): BlockchainImpl {
        this.visitedNode = {};
        return this.returnUsedBlockchainImplRec(topology.structure);
    }


    private returnUsedBlockchainImplRec(node: Node) {
        this.visitedNode = {};
        if (this.visitedNode[node.name]) {
            return;
        }

        if (node.blockchainArtefact) {
            return node.blockchainArtefact.bcImplementation;
        }

        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            let bcImpl: BlockchainImpl = this.returnUsedBlockchainImplRec(peer);
            if (bcImpl || bcImpl == 0) {
                return bcImpl;
            }
        }
    }

}