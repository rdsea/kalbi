"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InfrastructureAndArtefactsCreator_1 = require("../utils/InfrastructureAndArtefactsCreator");
const experiments_knowledge_service_types_1 = require("./experiments_knowledge_service_types");
const benchmark_types_1 = require("./benchmark_types");
const fs = require("fs");
class DataModelParser {
    constructor(logger) {
        this.logger = logger;
        this.infrastrutureArtefastCreator = new InfrastructureAndArtefactsCreator_1.InfrastructureAndArtefactsCreator();
        this.ethBcArtefacts = this.infrastrutureArtefastCreator.createBlockchainArtefactEthereum();
        this.hypfabBcArterfacts = this.infrastrutureArtefastCreator.createBlockchainArtefactHypFab();
    }
    parseAndStoreExperimentAtPath(path, outputPath) {
        try {
            let experimentStr = fs.readFileSync(path).toString();
            let experimentBF = JSON.parse(experimentStr);
            let exp = this.parseExperiment(experimentBF);
            fs.writeFileSync(outputPath, JSON.stringify(exp, null, 4));
            this.logger.info('Parsed Experiment data to the path: ' + outputPath);
        }
        catch (e) {
            this.logger.error(e);
        }
    }
    parseExperiment(bfExperiment) {
        this.logger.info('Parsing Experiment data from BenchmarkFramework format, to ExperimentKnowledgeService format...');
        let experiment = {
            _id: null,
            topology: this.parseTopology(bfExperiment.topology),
            depPattern: null,
            benchmark: bfExperiment.benchmarkResult
        };
        experiment.topology.caption = bfExperiment.name;
        this.logger.info('Parsing finished!');
        return experiment;
    }
    parseTopology(bfTopology) {
        let topology = {
            structure: this.parseNode(bfTopology.structure),
            _id: null,
            specificationLang: null,
            specification: null,
            caption: null
        };
        this.getSwarmLeader(topology.structure).blockchainArterfacts.push(this.hypfabBcArterfacts[2]);
        this.getSwarmLeader(topology.structure).blockchainArterfacts.push(this.hypfabBcArterfacts[3]);
        this.getSwarmLeader(topology.structure).blockchainArterfacts.push(this.hypfabBcArterfacts[4]);
        this.getSwarmLeader(topology.structure).blockchainArterfacts.push(this.hypfabBcArterfacts[5]);
        return topology;
    }
    parseNode(bfNode) {
        let nodeConnections = [];
        for (let connection of bfNode.connections) {
            let bfPeer = connection.connectionEndpoint;
            let peer = this.parseNode(bfPeer);
            let nodeConnection = {
                connectionEndpoint: peer,
                networkQuality: connection.netQuality
            };
            nodeConnections.push(nodeConnection);
        }
        let application = null;
        if (bfNode.nodeType == experiments_knowledge_service_types_1.NodeType.vehicle) {
            application = {
                _id: null,
                executionEnvironment: 'docker',
                repositoryTag: 'filiprydzi/v2x_communication',
                name: 'Application to exchange driving data within V2X'
            };
        }
        let node = {
            _id: null,
            container: this.parseContainer(bfNode.hostMachine.configuration),
            nodeType: bfNode.nodeType,
            blockchainArterfacts: this.parseBlockchainArtefact(bfNode.blockchainArtefact),
            name: bfNode.name,
            connections: nodeConnections,
            application: application
        };
        return node;
    }
    parseContainer(bfContainer) {
        if (!bfContainer) {
            throw 'Container configuration cannot be null';
        }
        let containerConfig = {
            provider: bfContainer.provider,
            name: bfContainer.name,
            vCPUcount: bfContainer.vCPUcount,
            storageSSD: bfContainer.storageSSD,
            storageHDD: bfContainer.storageHDD,
            os: bfContainer.os,
            memory: bfContainer.memory,
            _id: null
        };
        return containerConfig;
    }
    parseBlockchainArtefact(bfArtefact) {
        if (!bfArtefact) {
            return [];
        }
        let ethArtefacts = this.infrastrutureArtefastCreator.createBlockchainArtefactEthereum();
        let hypfabArtefacts = this.infrastrutureArtefastCreator.createBlockchainArtefactHypFab();
        if (bfArtefact.bcImplementation == benchmark_types_1.BlockchainImpl.eth) {
            if (bfArtefact.bcOperation == benchmark_types_1.BlockchainRole.creator) {
                return [ethArtefacts[0]];
            }
            else if (bfArtefact.bcOperation == benchmark_types_1.BlockchainRole.miner) {
                return [ethArtefacts[1]];
            }
            else if (bfArtefact.bcOperation == benchmark_types_1.BlockchainRole.all) {
                return ethArtefacts;
            }
        }
        else if (bfArtefact.bcImplementation == benchmark_types_1.BlockchainImpl.hypfab) {
            if (bfArtefact.bcOperation == benchmark_types_1.BlockchainRole.creator) {
                return [hypfabArtefacts[0]];
            }
            else if (bfArtefact.bcOperation == benchmark_types_1.BlockchainRole.miner) {
                return [hypfabArtefacts[1]];
            }
            else if (bfArtefact.bcOperation == benchmark_types_1.BlockchainRole.all) {
                return [hypfabArtefacts[0], hypfabArtefacts[1]];
            }
        }
    }
    getSwarmLeader(node) {
        let swarmLeader = null;
        if (node.nodeType == experiments_knowledge_service_types_1.NodeType.vehicle) {
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                if (peer.nodeType != experiments_knowledge_service_types_1.NodeType.vehicle) {
                    swarmLeader = peer;
                    break;
                }
            }
        }
        else {
            swarmLeader = node;
        }
        return swarmLeader;
    }
}
exports.DataModelParser = DataModelParser;
