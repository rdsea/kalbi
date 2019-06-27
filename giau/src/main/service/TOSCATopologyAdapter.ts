import {Logger} from "log4js";
import {
    BlockchainArtefact,
    Node,
    NodeNetworkQualityAssociationClass,
    ResourceType,
    DPNode,
    Topology
} from "../model/dtos";

export class TOSCATopologyAdapter {

    private visited = {};
    private resourceTypeDeploymentMap = {};
    private artefactCounter = {};

    private connectionTargetNodeName = {};

    private toscaJSONOutput = {};

    constructor(private logger: Logger) {

    }

    /**
     * TOSCA topology is a tree, with a single root.
     * @param toscaTopologyInJSON
     */
    public translateTOSCAToPureNodeStructure(toscaTopologyInJSON: any): DPNode {

        this.logger.info('Translating TOSCA to DPNode structure.');

        this.connectionTargetNodeName = {};

        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];

            let validNode: boolean = false;

            if (object.type && object.type === 'giau.nodes.RSU_RESOURCE') {
                validNode = true;
            } else if (object.type && object.type == 'giau.nodes.EDGE_SERVICE') {
                validNode = true;
            } else if (object.type && object.type == 'giau.nodes.VEHICLE_IOT') {
                validNode = true;
            } else if (object.type && object.type == 'giau.nodes.CLOUD_SERVICE') {
                validNode = true;
            }

            if (validNode) {
                if (object.relationships) {
                    for (let relationship of object.relationships) {
                        if (relationship.type == 'giau.relationships.nodes_network') {
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

            if (object.type && object.type === 'giau.nodes.RSU_RESOURCE') {
                validNode = true;
            } else if (object.type && object.type == 'giau.nodes.EDGE_SERVICE') {
                validNode = true;
            } else if (object.type && object.type == 'giau.nodes.VEHICLE_IOT') {
                validNode = true;
            } else if (object.type && object.type == 'giau.nodes.CLOUD_SERVICE') {
                validNode = true;
            }

            if (validNode) {
                if (!this.connectionTargetNodeName[key]) {
                    myNodeRootName = key;
                    break;
                }
            }
        }

        this.logger.info('>>> Constructing DPNode structure with root at ' + myNodeRootName);

        let rootNode: DPNode = this.buildStructureFromToscaTopology(myNodeRootName, toscaTopologyInJSON);
        return rootNode;
    }


    private buildStructureFromToscaTopology(rootNodeName: string, toscaTopologyInJSON): DPNode {

        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];

            if (key == rootNodeName) {

                let resourceType: ResourceType = null;

                if (object.type && object.type === 'giau.nodes.RSU_RESOURCE') {
                    resourceType = ResourceType.RSU_RESOURCE;
                } else if (object.type && object.type == 'giau.nodes.EDGE_SERVICE') {
                    resourceType = ResourceType.EDGE_SERVICE;
                } else if (object.type && object.type == 'giau.nodes.VEHICLE_IOT') {
                    resourceType = ResourceType.VEHICLE_IOT;
                } else if (object.type && object.type == 'giau.nodes.CLOUD_SERVICE') {
                    resourceType = ResourceType.CLOUD_SERVICE;
                }

                if (!resourceType) {
                    return;
                }

                let pureNode: DPNode = {
                    name: key,
                    resourceType: resourceType,
                    peers: []
                };

                if (object.relationships) {
                    for (let relationship of object.relationships) {
                        if (relationship.type == 'giau.relationships.nodes_network') {
                            let peerNode: DPNode = this.buildStructureFromToscaTopology(relationship.target, toscaTopologyInJSON);
                            pureNode.peers.push(peerNode);
                        }
                    }
                }
                return pureNode;
            }
        }
    }


    public translateTopologyToTOSCA(topology: Topology): any {

        this.artefactCounter = {};
        this.toscaJSONOutput = {};

        this.translateNodeToTOSCA(topology.structure);

        return this.toscaJSONOutput;
    }

    private translateNodeToTOSCA(node: Node) {

        let typeStr: string = '';

        if (node.resourceType == ResourceType.CLOUD_SERVICE) {
            typeStr = 'giau.nodes.CLOUD_SERVICE';
        } else if (node.resourceType == ResourceType.RSU_RESOURCE) {
            typeStr = 'giau.nodes.RSU_RESOURCE';
        } else if (node.resourceType == ResourceType.EDGE_SERVICE) {
            typeStr = 'giau.nodes.EDGE_SERVICE';
        } else if (node.resourceType == ResourceType.VEHICLE_IOT) {
            typeStr = 'giau.nodes.VEHICLE_IOT';
        }

        let toscaNodeData = {
            type: typeStr,
            relationships: [],
            properties: {
                memory: node.container.memory,
                os: node.container.os,
                storageSSD: node.container.storageSSD,
                storageHDD: node.container.storageHDD,
                vCPUcount: node.container.vCPUcount,
            }
        };


        for (let peer of node.connections) {
            let child: Node = peer.connectionEndpoint;

            let relationship = {
                target: child.name,
                type: 'giau.relationships.nodes_network',
                properties: {
                    name: peer.networkQuality.name,
                    bandwidth: peer.networkQuality.bandwidth,
                    latency: peer.networkQuality.latency
                }
            };
            toscaNodeData.relationships.push(relationship);

            this.translateNodeToTOSCA(child);
        }

        this.toscaJSONOutput[node.name] = toscaNodeData;

        for (let artefact of node.blockchainArterfacts) {

            let artefactName: string = artefact.bcMetadata.implementation + '-' + artefact.bcMetadata.featureName;
            if (!this.artefactCounter[artefactName]) {
                this.artefactCounter[artefactName] = 1;
            }
            artefactName = artefactName + '-' + this.artefactCounter[artefactName]++;

            let artefactJSONData = {
                type: 'giau.nodes.BlockchainArtefact',
                relationships: {
                    type: 'cloudify.relationships.contained_in',
                    target: node.name
                },
                properties: {
                    featureName: artefact.bcMetadata.featureName,
                    implementation: artefact.bcMetadata.implementation,
                    name: artefactName,
                    executionEnvironment: artefact.executionEnvironment,
                    repositoryTag: artefact.repositoryTag
                }
            };

            this.toscaJSONOutput[artefactName] = artefactJSONData;
        }

    }


    public applyTopologyPropertiesToTOSCA(topology: Topology, toscaTopologyInJSON: any) {

        this.visited = {};
        this.resourceTypeDeploymentMap = {};

        this.traverseTopology(topology.structure);

        for (let key in toscaTopologyInJSON.node_templates) {

            let object = toscaTopologyInJSON.node_templates[key];

            let originalNode: Node = null;

            if (object.type && object.type === 'giau.nodes.RSU_RESOURCE') {
                originalNode = this.resourceTypeDeploymentMap[ResourceType.RSU_RESOURCE];
            } else if (object.type && object.type == 'giau.nodes.EDGE_SERVICE') {
                originalNode = this.resourceTypeDeploymentMap[ResourceType.EDGE_SERVICE];
            } else if (object.type && object.type == 'giau.nodes.VEHICLE_IOT') {
                originalNode = this.resourceTypeDeploymentMap[ResourceType.VEHICLE_IOT];
            } else if (object.type && object.type == 'giau.nodes.CLOUD_SERVICE') {
                originalNode = this.resourceTypeDeploymentMap[ResourceType.CLOUD_SERVICE];
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
                        if (relationship.type == 'giau.relationships.nodes_network') {
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
            type: 'giau.nodes.BlockchainArtefact',
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
        if (!this.resourceTypeDeploymentMap[node.resourceType]) {
            let nodeCopy: Node = node;
            nodeCopy = JSON.parse(JSON.stringify(nodeCopy));
            nodeCopy.connections = []; // we don't need the connections here
            this.resourceTypeDeploymentMap[node.resourceType] = nodeCopy;
        }
        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            this.traverseTopology(peer);
        }
    }

}