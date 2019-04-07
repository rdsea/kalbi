import {Node, NodesAtContainer, NodeType} from "../types";


export abstract class AbsTopologyUtils {

    protected visitedNode = {};
    private topologyNodeTypeNames = [];

    private containers: Node[] = [];
    private nodesInContainer: NodesAtContainer = {};


    constructor(protected node: Node) {

        this.visitedNode = {};
        this.containers = [];
        this.nodesInContainer = {};
        this.groupNodesPerContainer(this.node);

    }


    public obtainAllTopologyNodeTypeNames(topology: Node, nodeType: NodeType): string[] {

        this.visitedNode = {};
        this.topologyNodeTypeNames = [];
        this.obtainAllTopologyNodeTypeNamesRec(topology, nodeType);

        return this.topologyNodeTypeNames;
    }

    private obtainAllTopologyNodeTypeNamesRec(topology: Node, nodeType: NodeType) {

        if (this.visitedNode[topology.name]) {
            return;
        }

        this.visitedNode[topology.name] = true;

        if (topology.nodeType == nodeType) {
            this.topologyNodeTypeNames.push(topology.name);
        }

        for (let connection of topology.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.obtainAllTopologyNodeTypeNamesRec(peer, nodeType);
        }
    }


    private groupNodesPerContainer(node: Node) {

        if (this.visitedNode[node.name]) {
            return;
        }

        this.visitedNode[node.name] = true;


        if (!this.nodesInContainer[node.hostMachine.name]) {
            this.nodesInContainer[node.hostMachine.name] = [];
            this.containers.push(node);
        }

        // copy constructor
        let topologyNodeStr: string = JSON.stringify(node);
        let topologyNode: Node = JSON.parse(topologyNodeStr);

        for (let connection of topologyNode.connections) {
            connection.connectionEndpoint = null;  // to save space and we dont need peers here again
        }

        this.nodesInContainer[node.hostMachine.name].push(topologyNode);


        for (let connection of node.connections) {
            let peerNode: Node = connection.connectionEndpoint;
            this.groupNodesPerContainer(peerNode);
        }
    }

    public getContainers(): Node[] {
        return this.containers;
    }

    public getNodesInContainer(): NodesAtContainer {
        return this.nodesInContainer;
    }

}