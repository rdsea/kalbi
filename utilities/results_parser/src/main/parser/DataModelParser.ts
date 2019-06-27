import {Logger} from "log4js";
import {InfrastructureAndArtefactsCreator} from "../utils/InfrastructureAndArtefactsCreator";
import {
    BlockchainArtefact,
    ContainerConfiguration,
    EdgeProcessingApplication,
    Experiment,
    Node,
    NodeNetworkQualityAssociationClass,
    ResourceType,
    Topology
} from "./experiments_knowledge_service_types";
import {
    BFBlockchainArtefact,
    BFContainerConfiguration,
    BFExperiment,
    BFNode,
    BFTopology, BlockchainImpl,
    BlockchainRole
} from "./benchmark_types";
import * as fs from "fs";


export class DataModelParser {

    private ethBcArtefacts: BlockchainArtefact[];
    private hypfabBcArterfacts: BlockchainArtefact[];

    private infrastrutureArtefastCreator: InfrastructureAndArtefactsCreator;

    constructor(private logger: Logger) {

        this.infrastrutureArtefastCreator = new InfrastructureAndArtefactsCreator();

        this.ethBcArtefacts = this.infrastrutureArtefastCreator.createBlockchainArtefactEthereum();
        this.hypfabBcArterfacts = this.infrastrutureArtefastCreator.createBlockchainArtefactHypFab();
    }

    public parseAndStoreExperimentAtPath(path: string, outputPath: string) {
        try {
            let experimentStr: string = fs.readFileSync(path).toString();
            let experimentBF: BFExperiment = JSON.parse(experimentStr);

            let exp: Experiment = this.parseExperiment(experimentBF);

            fs.writeFileSync(outputPath, JSON.stringify(exp, null, 4));

            this.logger.info('Parsed Experiment data to the path: ' + outputPath);

        } catch (e) {
            this.logger.error(e);
        }
    }


    public parseExperiment(bfExperiment: BFExperiment): Experiment {

        this.logger.info('Parsing Experiment data from BenchmarkFramework format, to ExperimentKnowledgeService format...');

        let experiment: Experiment = {
            _id: null,
            topology: this.parseTopology(bfExperiment.topology),
            depPattern: null,
            benchmark: bfExperiment.benchmarkResult
        };
        experiment.topology.caption = bfExperiment.name;

        this.logger.info('Parsing finished!');

        return experiment;
    }


    public parseTopology(bfTopology: BFTopology): Topology {
        let topology: Topology = {
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

    public parseNode(bfNode: BFNode): Node {

        let nodeConnections: NodeNetworkQualityAssociationClass [] = [];

        for (let connection of bfNode.connections) {
            let bfPeer: BFNode = connection.connectionEndpoint;
            let peer: Node = this.parseNode(bfPeer);

            let nodeConnection: NodeNetworkQualityAssociationClass = {
                connectionEndpoint: peer,
                networkQuality: connection.netQuality
            };
            nodeConnections.push(nodeConnection);
        }

        let application: EdgeProcessingApplication = null;

        if (bfNode.resourceType == ResourceType.VEHICLE_IOT) {
            application = {
                _id: null,
                executionEnvironment: 'docker',
                repositoryTag: 'filiprydzi/v2x_communication',
                name: 'Application to exchange driving data within V2X'
            };
        }

        let node: Node = {
            _id: null,
            container: this.parseContainer(bfNode.hostMachine.configuration),
            resourceType: bfNode.resourceType,
            blockchainArterfacts: this.parseBlockchainArtefact(bfNode.blockchainArtefact),
            name: bfNode.name,
            connections: nodeConnections,
            application: application
        }

        return node;
    }

    public parseContainer(bfContainer: BFContainerConfiguration): ContainerConfiguration {

        if (!bfContainer) {
            throw 'Container configuration cannot be null';
        }

        let containerConfig: ContainerConfiguration = {
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

    public parseBlockchainArtefact(bfArtefact: BFBlockchainArtefact): BlockchainArtefact[] {

        if (!bfArtefact) {
            return [];
        }

        let ethArtefacts: BlockchainArtefact[] = this.infrastrutureArtefastCreator.createBlockchainArtefactEthereum();
        let hypfabArtefacts: BlockchainArtefact[] = this.infrastrutureArtefastCreator.createBlockchainArtefactHypFab();

        if (bfArtefact.bcImplementation == BlockchainImpl.eth) {

            if (bfArtefact.bcOperation == BlockchainRole.creator) {
                return [ethArtefacts[0]];
            }
            else if (bfArtefact.bcOperation == BlockchainRole.miner) {
                return [ethArtefacts[1]];
            }
            else if (bfArtefact.bcOperation == BlockchainRole.all) {
                return ethArtefacts;
            }
        } else if (bfArtefact.bcImplementation == BlockchainImpl.hypfab) {

            if (bfArtefact.bcOperation == BlockchainRole.creator) {
                return [hypfabArtefacts[0]];
            }
            else if (bfArtefact.bcOperation == BlockchainRole.miner) {
                return [hypfabArtefacts[1]];
            }
            else if (bfArtefact.bcOperation == BlockchainRole.all) {
                return [hypfabArtefacts[0], hypfabArtefacts[1]];
            }
        }
    }





    private getSwarmLeader(node: Node): Node {

        let swarmLeader: Node = null;

        if (node.resourceType == ResourceType.VEHICLE_IOT) {

            for (let connection of node.connections) {
                let peer: Node = connection.connectionEndpoint;
                if (peer.resourceType != ResourceType.VEHICLE_IOT) {
                    swarmLeader = peer;
                    break;
                }
            }

        } else {
            swarmLeader = node;
        }

        return swarmLeader;
    }

}