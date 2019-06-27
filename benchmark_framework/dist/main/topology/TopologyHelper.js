"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
class TopologyHelper {
    constructor(logger) {
        this.logger = logger;
    }
    updateBlockchainArtefactInNodeType(node, bcArtefact, nodeType) {
        this.visitedNode = {};
        this.visitedHostMachine = {};
        this.updateBlockchainArtefactInNodeTypeRec(node, bcArtefact, nodeType);
    }
    updateBlockchainArtefactInNodeTypeRec(node, bcArtefact, nodeType) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;
        if (node.resourceType == nodeType) {
            node.blockchainArtefact = bcArtefact;
        }
        for (let connection of node.connections) {
            let peer = connection.connectionEndpoint;
            this.updateBlockchainArtefactInNodeTypeRec(peer, bcArtefact, nodeType);
        }
    }
    updateTopologyMachineType(topology, vehicleContainerConfig) {
        this.logger.info('====== Updating vehicle machines to ' + JSON.stringify(vehicleContainerConfig, null, 4) + ' ======');
        this.visitedNode = {};
        this.updateTopologyMachineTypeRec(topology, vehicleContainerConfig);
    }
    updateTopologyMachineTypeRec(topology, vehicleContainerConfig) {
        if (this.visitedNode[topology.name]) {
            return;
        }
        this.visitedNode[topology.name] = true;
        if (topology.resourceType == types_1.ResourceType.VEHICLE_IOT) {
            topology.hostMachine.ipAddress = null;
            topology.hostMachine.name = null;
            topology.hostMachine.configuration = vehicleContainerConfig;
        }
        for (let connection of topology.connections) {
            let peer = connection.connectionEndpoint;
            this.updateTopologyMachineTypeRec(peer, vehicleContainerConfig);
        }
    }
    updateTopologyNetworkQuality(topology, netQuality) {
        this.logger.info('====== Updating network quality to ' + netQuality.name + ' ======');
        this.visitedNode = {};
        this.updateTopologyNetworkQualityRec(topology, netQuality);
    }
    updateTopologyNetworkQualityRec(topology, netQuality) {
        if (this.visitedNode[topology.name]) {
            return;
        }
        this.visitedNode[topology.name] = true;
        for (let connection of topology.connections) {
            connection.netQuality = netQuality;
            let peer = connection.connectionEndpoint;
            this.updateTopologyNetworkQualityRec(peer, netQuality);
        }
    }
    obtainAllTopologyNodeNames(topology) {
        this.visitedNode = {};
        this.nodeNamesOfTopology = [];
        this.obtainAllTopologyNodeNamesRec(topology);
        return this.nodeNamesOfTopology;
    }
    obtainAllTopologyNodeNamesRec(topology) {
        if (this.visitedNode[topology.name]) {
            return;
        }
        this.visitedNode[topology.name] = true;
        this.nodeNamesOfTopology.push(topology.name);
        for (let connection of topology.connections) {
            let peer = connection.connectionEndpoint;
            this.obtainAllTopologyNodeNamesRec(peer);
        }
    }
    returnUsedBlockchainImpl(topology) {
        this.visitedNode = {};
        return this.returnUsedBlockchainImplRec(topology.structure);
    }
    returnUsedBlockchainImplRec(node) {
        this.visitedNode = {};
        if (this.visitedNode[node.name]) {
            return;
        }
        if (node.blockchainArtefact) {
            return node.blockchainArtefact.bcImplementation;
        }
        for (let connection of node.connections) {
            let peer = connection.connectionEndpoint;
            let bcImpl = this.returnUsedBlockchainImplRec(peer);
            if (bcImpl || bcImpl == 0) {
                return bcImpl;
            }
        }
    }
}
exports.TopologyHelper = TopologyHelper;
//# sourceMappingURL=TopologyHelper.js.map