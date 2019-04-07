import {Logger} from "log4js";
import {
    BlockchainArtefact,
    Node,
    NodeNetworkQualityAssociationClass,
    NodeType,
    PureNode,
    Topology
} from "../model/dtos";

export class TOSCATopologyAdapter {

    private visited = {};
    private nodeTypeDeploymentMap = {};
    private artefactCounter = {};

    private connectionTargetNodeName = {};

    constructor(private logger: Logger) {

    }

    /**
     * TOSCA topology is a tree, with a single root.
     * @param toscaTopologyInJSON
     */
    public translateTOSCAToPureNodeStructure(toscaTopologyInJSON: any): PureNode {

        this.logger.info('Translating TOSCA to PureNode structure.');

        this.connectionTargetNodeName = {};

        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];

            let validNode: boolean = false;

            if (object.type && object.type === 'filip.nodes.rsu') {
                validNode = true;
            } else if (object.type && object.type == 'filip.nodes.edge') {
                validNode = true;
            } else if (object.type && object.type == 'filip.nodes.vehicle') {
                validNode = true;
            } else if (object.type && object.type == 'filip.nodes.cloud') {
                validNode = true;
            }

            if (validNode) {
                if (object.relationships) {
                    for (let relationship of object.relationships) {
                        if (relationship.type == 'filip.relationships.nodes_network') {
                            let target: string = relationship.target;
                            this.connectionTargetNodeName[target] = true;
                        }
                    }
                }
            }
        }

        let myNodeRootName: string = null;

        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];

            let validNode: boolean = false;

            if (object.type && object.type === 'filip.nodes.rsu') {
                validNode = true;
            } else if (object.type && object.type == 'filip.nodes.edge') {
                validNode = true;
            } else if (object.type && object.type == 'filip.nodes.vehicle') {
                validNode = true;
            } else if (object.type && object.type == 'filip.nodes.cloud') {
                validNode = true;
            }

            if (validNode) {
                if (!this.connectionTargetNodeName[key]) {
                    myNodeRootName = key;
                    break;
                }
            }
        }

        this.logger.info('>>> Constructing PureNode structure with root at ' + myNodeRootName);

        let rootNode: PureNode = this.buildStructureFromToscaTopology(myNodeRootName, toscaTopologyInJSON);
        return rootNode;
    }


    private buildStructureFromToscaTopology(rootNodeName: string, toscaTopologyInJSON): PureNode {

        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];

            if (key == rootNodeName) {

                let nodeType: NodeType = null;

                if (object.type && object.type === 'filip.nodes.rsu') {
                    nodeType = NodeType.rsu;
                } else if (object.type && object.type == 'filip.nodes.edge') {
                    nodeType = NodeType.edge;
                } else if (object.type && object.type == 'filip.nodes.vehicle') {
                    nodeType = NodeType.vehicle;
                } else if (object.type && object.type == 'filip.nodes.cloud') {
                    nodeType = NodeType.cloud;
                }

                if (!nodeType) {
                    return;
                }

                let pureNode: PureNode = {
                    name: key,
                    nodeType: nodeType,
                    peers: []
                };

                if (object.relationships) {
                    for (let relationship of object.relationships) {
                        if (relationship.type == 'filip.relationships.nodes_network') {
                            let peerNode: PureNode = this.buildStructureFromToscaTopology(relationship.target, toscaTopologyInJSON);
                            pureNode.peers.push(peerNode);
                        }
                    }
                }
                return pureNode;
            }
        }
    }


    public applyTopologyPropertiesToTOSCA(topology: Topology, toscaTopologyInJSON: any) {

        this.visited = {};
        this.nodeTypeDeploymentMap = {};

        this.traverseTopology(topology.structure);

        for (let key in toscaTopologyInJSON.node_templates) {

            let object = toscaTopologyInJSON.node_templates[key];

            let originalNode: Node = null;

            if (object.type && object.type === 'filip.nodes.rsu') {
                originalNode = this.nodeTypeDeploymentMap[NodeType.rsu];
            } else if (object.type && object.type == 'filip.nodes.edge') {
                originalNode = this.nodeTypeDeploymentMap[NodeType.edge];
            } else if (object.type && object.type == 'filip.nodes.vehicle') {
                originalNode = this.nodeTypeDeploymentMap[NodeType.vehicle];
            } else if (object.type && object.type == 'filip.nodes.cloud') {
                originalNode = this.nodeTypeDeploymentMap[NodeType.cloud];
            }

            if (originalNode) {

                let nodeConnection: NodeNetworkQualityAssociationClass = null;
                if (topology.structure.connections && topology.structure.connections.length > 0) {
                    nodeConnection = topology.structure.connections[0];
                }

                // if nodeConnection == null -> we dont have a topology with any connection, so we cant recommend its quality.
                // seting network quality here
                if (nodeConnection && object.relationships) {
                    for (let i = 0; i < object.relationships.length; i++) {
                        let relationship = object.relationships[i];
                        if (relationship.type == 'filip.relationships.nodes_network') {
                            if (!relationship.properties) {
                                relationship['properties'] = {};
                            }
                            relationship.properties.name = nodeConnection.networkQuality.name;
                            relationship.properties.bandwidth = nodeConnection.networkQuality.bandwidth;
                            relationship.properties.latency = nodeConnection.networkQuality.latency;
                        }
                    }
                }
                this.setTOSCANodeProperties(originalNode, object);


                for (let artefact of originalNode.blockchainArterfacts) {
                    this.addBcArtefactToTOSCA(toscaTopologyInJSON, artefact, key);
                }
            }
        }
        return toscaTopologyInJSON;
    }

    private setTOSCANodeProperties(originalNode: Node, toscaNode: any) {

        if (!toscaNode.properties) {
            toscaNode['properties'] = {};
        }
        toscaNode.properties.memory = originalNode.container.memory;
        toscaNode.properties.os = originalNode.container.os;
        toscaNode.properties.storageHDD = originalNode.container.storageHDD;
        toscaNode.properties.storageSSD = originalNode.container.storageSSD;
        toscaNode.properties.vCPUcount = originalNode.container.vCPUcount;
    }


    private addBcArtefactToTOSCA(toscaTopologyInJSON: any, bcArtefact: BlockchainArtefact, containerName: string) {

        let artefactName: string = bcArtefact.bcMetadata.implementation + '-' + bcArtefact.bcMetadata.featureName;
        if (!this.artefactCounter[artefactName]) {
            this.artefactCounter[artefactName] = 1;
        }
        artefactName = artefactName + '-' + this.artefactCounter[artefactName]++;

        toscaTopologyInJSON.node_templates[artefactName] = this.deployedBcArtefactToTOSCAType(artefactName, bcArtefact, containerName);
    }

    private deployedBcArtefactToTOSCAType(artefactName: string, bcArtefact: BlockchainArtefact, containerName: string) {

        return {
            type: 'filip.nodes.BlockchainArtefact',
            relationships: [
                {
                    type: 'cloudify.relationships.contained_in',
                    target: containerName
                }
            ],
            capabilities: {
                scalable: {
                    properties: {
                        default_instances: 1
                    }
                }
            },
            properties: {
                featureName: bcArtefact.bcMetadata.featureName,
                implementation: bcArtefact.bcMetadata.implementation,
                name: artefactName,
                executionEnvironment: bcArtefact.executionEnvironment,
                repositoryTag: bcArtefact.repositoryTag
            }
        };

    }

    private traverseTopology(node: Node) {
        if (this.visited[node.name]) {
            return;
        }
        this.visited[node.name];
        if (!this.nodeTypeDeploymentMap[node.nodeType]) {
            let nodeCopy: Node = node;
            nodeCopy = JSON.parse(JSON.stringify(nodeCopy));
            nodeCopy.connections = []; // we don't need the connections here
            this.nodeTypeDeploymentMap[node.nodeType] = nodeCopy;
        }
        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.traverseTopology(peer);
        }
    }

}