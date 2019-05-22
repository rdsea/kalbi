"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const AbsTopologyUtils_1 = require("../AbsTopologyUtils");
class HypFabTopologyUtils extends AbsTopologyUtils_1.AbsTopologyUtils {
    constructor(node) {
        super(node);
        this.peerNames = [];
        this.ordererNames = [];
        this.visitedNode = {};
        this.ordererNames = [];
        this.obtainOrdererNamesRec(this.node);
        this.visitedNode = {};
        this.peerNames = [];
        this.obtainPeerNamesRec(this.node);
        this.mainOrdererName = this.findMainOrdererName(this.node) + '_orderer';
        this.mainPeerName = this.findMainPeerName(this.node) + '_peer';
    }
    getPeerNames() {
        return this.peerNames;
    }
    getOrdererNames() {
        return this.ordererNames;
    }
    getMainOrdererName() {
        return this.mainOrdererName;
    }
    getMainPeerName() {
        return this.mainPeerName;
    }
    obtainOrdererNamesRec(node) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;
        if (node.blockchainArtefact.bcOperation == types_1.BlockchainRole.all || node.blockchainArtefact.bcOperation == types_1.BlockchainRole.miner) {
            this.ordererNames.push(node.name + '_orderer');
        }
        for (let connection of node.connections) {
            let peer = connection.connectionEndpoint;
            this.obtainOrdererNamesRec(peer);
        }
    }
    obtainPeerNamesRec(node) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;
        if (node.blockchainArtefact.bcOperation == types_1.BlockchainRole.all || node.blockchainArtefact.bcOperation == types_1.BlockchainRole.creator) {
            this.peerNames.push(node.name + '_peer');
        }
        for (let connection of node.connections) {
            let peer = connection.connectionEndpoint;
            this.obtainPeerNamesRec(peer);
        }
    }
    findMainOrdererName(topology) {
        if (topology.blockchainArtefact.bcOperation == types_1.BlockchainRole.all || topology.blockchainArtefact.bcOperation == types_1.BlockchainRole.miner) {
            return topology.name;
        }
        else {
            for (let connection of topology.connections) {
                let peer = connection.connectionEndpoint;
                return this.findMainOrdererName(peer);
            }
        }
    }
    findMainPeerName(topology) {
        if (topology.blockchainArtefact.bcOperation == types_1.BlockchainRole.creator || topology.blockchainArtefact.bcOperation == types_1.BlockchainRole.all) {
            return topology.name;
        }
        else {
            for (let connection of topology.connections) {
                let peer = connection.connectionEndpoint;
                return this.findMainPeerName(peer);
            }
        }
    }
}
exports.HypFabTopologyUtils = HypFabTopologyUtils;
//# sourceMappingURL=HypFabTopologyUtils.js.map