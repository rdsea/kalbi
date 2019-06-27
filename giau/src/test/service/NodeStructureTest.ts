import {DependencyInjection} from "../../main/DependencyInjection";
import {
    IContainerConfigurationService,
    INodeStructureService,
    ISoftwareArtefactsService
} from "../../main/service/interfaces";
import {
    BlockchainArtefact,
    BlockchainMetadata,
    ContainerConfiguration,
    EdgeService,
    EdgeProcessingApplication,
    NetworkQuality,
    Node,
    NodeNetworkQualityAssociationClass,
    ResourceType,
    RSUResource,
    SoftwareArtefact,
    VehicleIoT
} from "../../main/model/dtos";
import {MongoDb} from "../../main/repository/MongoDb";
import {INodeStructureRepository} from "../../main/repository/interfaces";
import {NodeDataModel} from "../../main/model/data_models";
import {load} from "js-yaml";


const assert = require('assert');

describe('NodeStructureService tests', () => {

    let dependecnyInjection: DependencyInjection = new DependencyInjection();
    let nodeStructureService: INodeStructureService = null;
    let nodeStructureRepo: INodeStructureRepository = null;
    let softwareArtefactService: ISoftwareArtefactsService = null;
    let containerService: IContainerConfigurationService = null;

    before(async () => {
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.createConnection();
        nodeStructureService = dependecnyInjection.createNodeStructureService();
        softwareArtefactService = dependecnyInjection.createSoftwareArtefactsService();
        containerService = dependecnyInjection.createContainerConfigurationService();
        nodeStructureRepo = dependecnyInjection.createNodeStructureRepository();
    });

    after(async () => {
        // close db connection
        await dependecnyInjection.createGraphAPI().closeConnection();
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.closeConnection();
    });

    afterEach(async () => {
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.getDb().dropDatabase();
    });

    it('createShouldReturnCreatedNodeStructure', async () => {

        let artefactsBefore: SoftwareArtefact[] = await softwareArtefactService.readAll();
        let containersBefore: ContainerConfiguration[] = await containerService.readAll();

        let nodesDataModels: NodeDataModel[] = await nodeStructureRepo.readAll();
        let oldNodesCount = 0;
        if (nodesDataModels) {
            oldNodesCount = nodesDataModels.length;
        }

        let nodeStructure: Node = createStructureForInteraction4Large();
        nodeStructure = await nodeStructureService.create(nodeStructure);

        assert(nodeStructure.connections.length == 2);
        assert(nodeStructure.connections[0].connectionEndpoint.connections.length == 24);
        assert(nodeStructure.connections[1].connectionEndpoint.connections.length == 24);

        nodesDataModels = await nodeStructureRepo.readAll();
        let newCount: number = 0;
        if (nodesDataModels) {
            newCount = nodesDataModels.length;
        }

        assert(newCount == oldNodesCount + 51);

        assert(nodeStructure);
        assert(nodeStructure._id);

        await checkCreatedAcyclicStructure(nodeStructure);

        let artefactsAfter: SoftwareArtefact[] = await softwareArtefactService.readAll();
        let containersAfter: ContainerConfiguration[] = await containerService.readAll();

        assert(artefactsBefore.length + 2 == artefactsAfter.length);
        assert(containersBefore.length + 3 == containersAfter.length);
    });

    it('createShouldReturnCreatedCyclicNodeStructure', async () => {

        let container: ContainerConfiguration = {
            memory: 4,
            storageSSD: 10,
            storageHDD: 0,
            vCPUcount: 2,
            provider: 'GCP',
            os: 'ubuntu18.04',
            name: 'container1',
            _id: null
        };

        let netQuality: NetworkQuality = {
            latency: '100ms',
            bandwidth: '5Mbps',
            name: '4G'
        };

        let node1: Node = {
            _id: null,
            name: 'node1',
            connections: [],
            blockchainArterfacts: [],
            resourceType: ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };

        let node2: Node = {
            _id: null,
            name: 'node2',
            connections: [],
            blockchainArterfacts: [],
            resourceType: ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };

        let node3: Node = {
            _id: null,
            name: 'node3',
            connections: [],
            blockchainArterfacts: [],
            resourceType: ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };

        let nodeConnection1: NodeNetworkQualityAssociationClass = {
            connectionEndpoint: node2,
            networkQuality: netQuality
        };

        let nodeConnection2: NodeNetworkQualityAssociationClass = {
            connectionEndpoint: node3,
            networkQuality: netQuality
        };

        let nodeConnection3: NodeNetworkQualityAssociationClass = {
            connectionEndpoint: node1,
            networkQuality: netQuality
        };

        node1.connections.push(nodeConnection1);
        node2.connections.push(nodeConnection2);
        node3.connections.push(nodeConnection3);

        node1 = await nodeStructureService.create(node1);

        assert(node1);
        assert(node1._id);

        // cyclic structure
        assert(node1 == node3.connections[0].connectionEndpoint);
    });


    it('loadStructureShouldReturnCyclicNodeStructure', async () => {

        let container: ContainerConfiguration = {
            memory: 4,
            storageSSD: 10,
            storageHDD: 0,
            vCPUcount: 2,
            provider: 'GCP',
            os: 'ubuntu18.04',
            name: 'container1',
            _id: null
        };

        let netQuality: NetworkQuality = {
            latency: '100ms',
            bandwidth: '5Mbps',
            name: '4G'
        };

        let node1: Node = {
            _id: null,
            name: 'node1',
            connections: [],
            blockchainArterfacts: [],
            resourceType: ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };

        let node2: Node = {
            _id: null,
            name: 'node2',
            connections: [],
            blockchainArterfacts: [],
            resourceType: ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };

        let node3: Node = {
            _id: null,
            name: 'node3',
            connections: [],
            blockchainArterfacts: [],
            resourceType: ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };

        let nodeConnection1: NodeNetworkQualityAssociationClass = {
            connectionEndpoint: node2,
            networkQuality: netQuality
        };

        let nodeConnection2: NodeNetworkQualityAssociationClass = {
            connectionEndpoint: node3,
            networkQuality: netQuality
        };

        let nodeConnection3: NodeNetworkQualityAssociationClass = {
            connectionEndpoint: node1,
            networkQuality: netQuality
        };

        node1.connections.push(nodeConnection1);
        node2.connections.push(nodeConnection2);
        node3.connections.push(nodeConnection3);

        node1 = await nodeStructureService.create(node1);

        let loadedNode: Node = await nodeStructureService.readStructure(node1._id);

        assert(loadedNode);
        assert(node1._id == loadedNode._id);

        // cyclic structure is correctly loaded
        assert(loadedNode.connections[0].connectionEndpoint.connections[0].connectionEndpoint.connections[0].connectionEndpoint == loadedNode);

    });


    it('deleteNodeStructureShouldDelete', async () => {

        let nodeStructure: Node = createStructureForInteraction4Large();
        nodeStructure = await nodeStructureService.create(nodeStructure);

        await nodeStructureService.deleteStructure(nodeStructure._id);

        let structure: Node = await nodeStructureService.readStructure(nodeStructure._id);
        assert(structure == null);

        await checkDeletedStructure(nodeStructure);
    });

    async function checkCreatedAcyclicStructure(root: Node) {

        let node: Node = await nodeStructureService.readStructure(root._id);

        assert(node);
        assert(node._id);
        assert(node._id == root._id);

        let container: ContainerConfiguration = await containerService.readOne(node.container._id);
        assert(container);
        assert(container._id == node.container._id);

        for (let artefact of node.blockchainArterfacts) {
            let readArt: BlockchainArtefact = <BlockchainArtefact> await softwareArtefactService.readOne(artefact._id);
            assert(readArt);
            assert(readArt._id == artefact._id);
        }

        if (root.connections) {

            assert(root.connections.length == node.connections.length);

            for (let connection of root.connections) {
                let f: boolean = false;
                for (let nodeConn of node.connections) {
                    if (nodeConn.connectionEndpoint._id == connection.connectionEndpoint._id) {
                        f = true;
                        break;
                    }
                }
                assert(f);

                let peer: Node = connection.connectionEndpoint;
                await checkCreatedAcyclicStructure(peer);
            }
        }
    }

    async function checkDeletedStructure(root: Node) {
        let node: Node = await nodeStructureService.readStructure(root._id);
        assert(node == null);

        // container and blockchain artefacts havent been deleted with the node
        let container: ContainerConfiguration = await containerService.readOne(root.container._id);
        assert(container);
        assert(container._id == root.container._id);

        for (let artefact of root.blockchainArterfacts) {
            let readArt: BlockchainArtefact = <BlockchainArtefact> await softwareArtefactService.readOne(artefact._id);
            assert(readArt);
            assert(readArt._id == artefact._id);
        }

        if (root.connections) {
            for (let connection of root.connections) {
                let peer: Node = connection.connectionEndpoint;
                await checkDeletedStructure(peer);
            }
        }

    }

});


export function createStructureForInteraction4Large(): Node {

    let netQuality: NetworkQuality = {
        name: '5G',
        bandwidth: '1Mbs',
        latency: '5ms'
    };

    let rsuMachine: ContainerConfiguration = {
        _id: null,
        name: 'small-machine',
        os: 'ubuntu18.04',
        provider: 'Google Cloud Platform',
        vCPUcount: 1,
        memory: 2,
        storageHDD: 0,
        storageSSD: 20
    };

    let vehicleVM: ContainerConfiguration = {
        _id: null,
        name: 'medium-machine',
        os: 'ubuntu18.04',
        provider: 'Google Cloud Platform',
        vCPUcount: 2,
        memory: 4,
        storageHDD: 0,
        storageSSD: 20
    };

    let edgeMachine: ContainerConfiguration = {
        _id: null,
        name: 'big-machine',
        os: 'ubuntu18.04',
        provider: 'Google Cloud Platform',
        vCPUcount: 4,
        memory: 8,
        storageHDD: 0,
        storageSSD: 20
    };

    let ethPeerMetada: BlockchainMetadata = {
        implementation: 'ethereum',
        featureName: 'creator'
    };

    let ethMinerMetadata: BlockchainMetadata = {
        implementation: 'ethereum',
        featureName: 'miner'
    };

    let ethPeer: BlockchainArtefact = {
        _id: null,
        name: 'ethereum peer',
        executionEnvironment: 'docker',
        repositoryTag: 'ethereum/client-go',
        bcMetadata: ethPeerMetada
    };

    let ethMiner: BlockchainArtefact = {
        _id: null,
        name: 'ethereum miner',
        executionEnvironment: 'docker',
        repositoryTag: 'ethereum/client-go',
        bcMetadata: ethMinerMetadata
    };


    let edgeProcessingApplication: EdgeProcessingApplication = null;

    let deploymentMap = {};

    deploymentMap[ResourceType.EDGE_SERVICE] = [ethMiner];
    deploymentMap[ResourceType.VEHICLE_IOT] = [ethMiner];
    deploymentMap[ResourceType.RSU_RESOURCE] = [ethPeer];

    let mainNode: EdgeService = {
        _id: null,
        resourceType: ResourceType.EDGE_SERVICE,
        name: "edge1",
        connections: [],
        application: edgeProcessingApplication,
        blockchainArterfacts: deploymentMap[ResourceType.EDGE_SERVICE],
        container: edgeMachine
    };

    let rsuNode1: RSUResource = {
        _id: null,
        resourceType: ResourceType.RSU_RESOURCE,
        name: 'rsu1',
        connections: [],
        blockchainArterfacts: deploymentMap[ResourceType.RSU_RESOURCE],
        application: edgeProcessingApplication,
        container: rsuMachine
    };

    let rsuNode2: RSUResource = {
        _id: null,
        resourceType: ResourceType.RSU_RESOURCE,
        name: 'rsu2',
        connections: [],
        blockchainArterfacts: deploymentMap[ResourceType.RSU_RESOURCE],
        application: edgeProcessingApplication,
        container: rsuMachine
    };

    let connection1: NodeNetworkQualityAssociationClass = {
        networkQuality: netQuality,
        connectionEndpoint: rsuNode1,
    };

    let connection2: NodeNetworkQualityAssociationClass = {
        networkQuality: netQuality,
        connectionEndpoint: rsuNode2,
    };

    for (let i = 0; i < 24; i++) {

        let peerNode: VehicleIoT = {
            _id: null,
            resourceType: ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            connections: [],
            container: vehicleVM,
            application: edgeProcessingApplication,
            blockchainArterfacts: deploymentMap[ResourceType.VEHICLE_IOT]
        };

        let connection: NodeNetworkQualityAssociationClass = {
            networkQuality: netQuality,
            connectionEndpoint: peerNode,
        };

        rsuNode1.connections.push(connection);
    }

    for (let i = 24; i < 48; i++) {

        let peerNode: VehicleIoT = {
            _id: null,
            resourceType: ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            connections: [],
            container: vehicleVM,
            application: edgeProcessingApplication,
            blockchainArterfacts: deploymentMap[ResourceType.VEHICLE_IOT]
        };

        let connection: NodeNetworkQualityAssociationClass = {
            networkQuality: netQuality,
            connectionEndpoint: peerNode,
        };

        rsuNode2.connections.push(connection);
    }

    mainNode.connections.push(connection1);
    mainNode.connections.push(connection2);

    return mainNode;
}