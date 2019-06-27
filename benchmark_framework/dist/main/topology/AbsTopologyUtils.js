"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbsTopologyUtils {
    constructor(node) {
        this.node = node;
        this.visitedNode = {};
        this.topologyNodeTypeNames = [];
        this.containers = [];
        this.nodesInContainer = {};
        this.visitedNode = {};
        this.containers = [];
        this.nodesInContainer = {};
        this.groupNodesPerContainer(this.node);
    }
    obtainAllTopologyNodeTypeNames(topology, nodeType) {
        this.visitedNode = {};
        this.topologyNodeTypeNames = [];
        this.obtainAllTopologyNodeTypeNamesRec(topology, nodeType);
        return this.topologyNodeTypeNames;
    }
    obtainAllTopologyNodeTypeNamesRec(topology, nodeType) {
        if (this.visitedNode[topology.name]) {
            return;
        }
        this.visitedNode[topology.name] = true;
        if (topology.resourceType == nodeType) {
            this.topologyNodeTypeNames.push(topology.name);
        }
        for (let connection of topology.connections) {
            let peer = connection.connectionEndpoint;
            this.obtainAllTopologyNodeTypeNamesRec(peer, nodeType);
        }
    }
    groupNodesPerContainer(node) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;
        if (!this.nodesInContainer[node.hostMachine.name]) {
            this.nodesInContainer[node.hostMachine.name] = [];
            this.containers.push(node);
        }
        // copy constructor
        let topologyNodeStr = JSON.stringify(node);
        let topologyNode = JSON.parse(topologyNodeStr);
        for (let connection of topologyNode.connections) {
            connection.connectionEndpoint = null; // to save space and we dont need peers here again
        }
        this.nodesInContainer[node.hostMachine.name].push(topologyNode);
        for (let connection of node.connections) {
            let peerNode = connection.connectionEndpoint;
            this.groupNodesPerContainer(peerNode);
        }
    }
    getContainers() {
        return this.containers;
    }
    getNodesInContainer() {
        return this.nodesInContainer;
    }
}
exports.AbsTopologyUtils = AbsTopologyUtils;
//# sourceMappingURL=AbsTopologyUtils.js.map