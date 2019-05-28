"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dtos_1 = require("../model/dtos");
class TOSCATopologyAdapter {
    constructor(logger) {
        this.logger = logger;
        this.visited = {};
        this.nodeTypeDeploymentMap = {};
        this.artefactCounter = {};
        this.connectionTargetNodeName = {};
    }
    /**
     * TOSCA topology is a tree, with a single root.
     * @param toscaTopologyInJSON
     */
    translateTOSCAToPureNodeStructure(toscaTopologyInJSON) {
        this.logger.info('Translating TOSCA to PureNode structure.');
        this.connectionTargetNodeName = {};
        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];
            let validNode = false;
            if (object.type && object.type === 'filip.nodes.rsu') {
                validNode = true;
            }
            else if (object.type && object.type == 'filip.nodes.edge') {
                validNode = true;
            }
            else if (object.type && object.type == 'filip.nodes.vehicle') {
                validNode = true;
            }
            else if (object.type && object.type == 'filip.nodes.cloud') {
                validNode = true;
            }
            if (validNode) {
                if (object.relationships) {
                    for (let relationship of object.relationships) {
                        if (relationship.type == 'filip.relationships.nodes_network') {
                            let target = relationship.target;
                            this.connectionTargetNodeName[target] = true;
                        }
                    }
                }
            }
        }
        let myNodeRootName = null;
        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];
            let validNode = false;
            if (object.type && object.type === 'filip.nodes.rsu') {
                validNode = true;
            }
            else if (object.type && object.type == 'filip.nodes.edge') {
                validNode = true;
            }
            else if (object.type && object.type == 'filip.nodes.vehicle') {
                validNode = true;
            }
            else if (object.type && object.type == 'filip.nodes.cloud') {
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
        let rootNode = this.buildStructureFromToscaTopology(myNodeRootName, toscaTopologyInJSON);
        return rootNode;
    }
    buildStructureFromToscaTopology(rootNodeName, toscaTopologyInJSON) {
        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];
            if (key == rootNodeName) {
                let nodeType = null;
                if (object.type && object.type === 'filip.nodes.rsu') {
                    nodeType = dtos_1.NodeType.rsu;
                }
                else if (object.type && object.type == 'filip.nodes.edge') {
                    nodeType = dtos_1.NodeType.edge;
                }
                else if (object.type && object.type == 'filip.nodes.vehicle') {
                    nodeType = dtos_1.NodeType.vehicle;
                }
                else if (object.type && object.type == 'filip.nodes.cloud') {
                    nodeType = dtos_1.NodeType.cloud;
                }
                if (!nodeType) {
                    return;
                }
                let pureNode = {
                    name: key,
                    nodeType: nodeType,
                    peers: []
                };
                if (object.relationships) {
                    for (let relationship of object.relationships) {
                        if (relationship.type == 'filip.relationships.nodes_network') {
                            let peerNode = this.buildStructureFromToscaTopology(relationship.target, toscaTopologyInJSON);
                            pureNode.peers.push(peerNode);
                        }
                    }
                }
                return pureNode;
            }
        }
    }
    applyTopologyPropertiesToTOSCA(topology, toscaTopologyInJSON) {
        this.visited = {};
        this.nodeTypeDeploymentMap = {};
        this.traverseTopology(topology.structure);
        for (let key in toscaTopologyInJSON.node_templates) {
            let object = toscaTopologyInJSON.node_templates[key];
            let originalNode = null;
            if (object.type && object.type === 'filip.nodes.rsu') {
                originalNode = this.nodeTypeDeploymentMap[dtos_1.NodeType.rsu];
            }
            else if (object.type && object.type == 'filip.nodes.edge') {
                originalNode = this.nodeTypeDeploymentMap[dtos_1.NodeType.edge];
            }
            else if (object.type && object.type == 'filip.nodes.vehicle') {
                originalNode = this.nodeTypeDeploymentMap[dtos_1.NodeType.vehicle];
            }
            else if (object.type && object.type == 'filip.nodes.cloud') {
                originalNode = this.nodeTypeDeploymentMap[dtos_1.NodeType.cloud];
            }
            if (originalNode) {
                let nodeConnection = null;
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
    setTOSCANodeProperties(originalNode, toscaNode) {
        if (!toscaNode.properties) {
            toscaNode['properties'] = {};
        }
        toscaNode.properties.memory = originalNode.container.memory;
        toscaNode.properties.os = originalNode.container.os;
        toscaNode.properties.storageHDD = originalNode.container.storageHDD;
        toscaNode.properties.storageSSD = originalNode.container.storageSSD;
        toscaNode.properties.vCPUcount = originalNode.container.vCPUcount;
    }
    addBcArtefactToTOSCA(toscaTopologyInJSON, bcArtefact, containerName) {
        let artefactName = bcArtefact.bcMetadata.implementation + '-' + bcArtefact.bcMetadata.featureName;
        if (!this.artefactCounter[artefactName]) {
            this.artefactCounter[artefactName] = 1;
        }
        artefactName = artefactName + '-' + this.artefactCounter[artefactName]++;
        toscaTopologyInJSON.node_templates[artefactName] = this.deployedBcArtefactToTOSCAType(artefactName, bcArtefact, containerName);
    }
    deployedBcArtefactToTOSCAType(artefactName, bcArtefact, containerName) {
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
    traverseTopology(node) {
        if (this.visited[node.name]) {
            return;
        }
        this.visited[node.name];
        if (!this.nodeTypeDeploymentMap[node.nodeType]) {
            let nodeCopy = node;
            nodeCopy = JSON.parse(JSON.stringify(nodeCopy));
            nodeCopy.connections = []; // we don't need the connections here
            this.nodeTypeDeploymentMap[node.nodeType] = nodeCopy;
        }
        for (let connection of node.connections) {
            let peer = connection.connectionEndpoint;
            this.traverseTopology(peer);
        }
    }
}
exports.TOSCATopologyAdapter = TOSCATopologyAdapter;
//# sourceMappingURL=TOSCATopologyAdapter.js.map