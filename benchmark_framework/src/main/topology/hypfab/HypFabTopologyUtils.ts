import {BlockchainRole, Node, ResourceType} from "../../types";
import {AbsTopologyUtils} from "../AbsTopologyUtils";


export class HypFabTopologyUtils extends AbsTopologyUtils{


    private peerNames: string[] = [];
    private ordererNames: string[] = [];

    private mainPeerName: string;
    private mainOrdererName: string;


    constructor(node: Node) {
        super(node);

        this.visitedNode = {};
        this.ordererNames = [];
        this.obtainOrdererNamesRec(this.node);

        this.visitedNode = {};
        this.peerNames = [];
        this.obtainPeerNamesRec(this.node);

        this.mainOrdererName = this.findMainOrdererName(this.node) + '_orderer';
        this.mainPeerName = this.findMainPeerName(this.node) + '_peer';

    }

    public getPeerNames(): string[] {
        return this.peerNames;
    }

    public getOrdererNames(): string[] {
        return this.ordererNames;
    }

    public getMainOrdererName(): string {
        return this.mainOrdererName;
    }

    public getMainPeerName(): string {
        return this.mainPeerName;
    }


    private obtainOrdererNamesRec(node: Node): string[] {

        if (this.visitedNode[node.name]) {
            return;
        }

        this.visitedNode[node.name] = true;

        if (node.blockchainArtefact.bcOperation == BlockchainRole.all || node.blockchainArtefact.bcOperation == BlockchainRole.miner) {
            this.ordererNames.push(node.name + '_orderer');
        }

        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.obtainOrdererNamesRec(peer);
        }

    }

    private obtainPeerNamesRec(node: Node): string[] {

        if (this.visitedNode[node.name]) {
            return;
        }

        this.visitedNode[node.name] = true;

        if (node.blockchainArtefact.bcOperation == BlockchainRole.all || node.blockchainArtefact.bcOperation == BlockchainRole.creator) {
            this.peerNames.push(node.name + '_peer');
        }

        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.obtainPeerNamesRec(peer);
        }

    }

    private findMainOrdererName(topology: Node) {

        if (topology.blockchainArtefact.bcOperation == BlockchainRole.all || topology.blockchainArtefact.bcOperation == BlockchainRole.miner) {
            return topology.name;
        } else {
            for (let connection of topology.connections) {
                let peer: Node = connection.connectionEndpoint;
                return this.findMainOrdererName(peer);
            }
        }
    }

    private findMainPeerName(topology: Node) {

        if (topology.blockchainArtefact.bcOperation == BlockchainRole.creator || topology.blockchainArtefact.bcOperation == BlockchainRole.all) {
            return topology.name;
        } else {
            for (let connection of topology.connections) {
                let peer: Node = connection.connectionEndpoint;
                return this.findMainPeerName(peer);
            }
        }
    }

}