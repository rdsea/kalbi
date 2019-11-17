"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DependencyInjection_1 = require("../../main/DependencyInjection");
const dtos_1 = require("../../main/model/dtos");
const assert = require('assert');
describe('NodeStructureService tests', () => {
    let dependecnyInjection = new DependencyInjection_1.DependencyInjection();
    let nodeStructureService = null;
    let nodeStructureRepo = null;
    let softwareArtefactService = null;
    let containerService = null;
    before(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.createConnection();
        nodeStructureService = dependecnyInjection.createNodeStructureService();
        softwareArtefactService = dependecnyInjection.createSoftwareArtefactsService();
        containerService = dependecnyInjection.createContainerConfigurationService();
        nodeStructureRepo = dependecnyInjection.createNodeStructureRepository();
    }));
    after(() => __awaiter(this, void 0, void 0, function* () {
        // close db connection
        yield dependecnyInjection.createGraphAPI().closeConnection();
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.closeConnection();
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.getDb().dropDatabase();
    }));
    it('createShouldReturnCreatedNodeStructure', () => __awaiter(this, void 0, void 0, function* () {
        let artefactsBefore = yield softwareArtefactService.readAll();
        let containersBefore = yield containerService.readAll();
        let nodesDataModels = yield nodeStructureRepo.readAll();
        let oldNodesCount = 0;
        if (nodesDataModels) {
            oldNodesCount = nodesDataModels.length;
        }
        let nodeStructure = createStructureForInteraction4Large();
        nodeStructure = yield nodeStructureService.create(nodeStructure);
        assert(nodeStructure.connections.length == 2);
        assert(nodeStructure.connections[0].connectionEndpoint.connections.length == 24);
        assert(nodeStructure.connections[1].connectionEndpoint.connections.length == 24);
        nodesDataModels = yield nodeStructureRepo.readAll();
        let newCount = 0;
        if (nodesDataModels) {
            newCount = nodesDataModels.length;
        }
        assert(newCount == oldNodesCount + 51);
        assert(nodeStructure);
        assert(nodeStructure._id);
        yield checkCreatedAcyclicStructure(nodeStructure);
        let artefactsAfter = yield softwareArtefactService.readAll();
        let containersAfter = yield containerService.readAll();
        assert(artefactsBefore.length + 2 == artefactsAfter.length);
        assert(containersBefore.length + 3 == containersAfter.length);
    }));
    it('createShouldReturnCreatedCyclicNodeStructure', () => __awaiter(this, void 0, void 0, function* () {
        let container = {
            memory: 4,
            storageSSD: 10,
            storageHDD: 0,
            vCPUcount: 2,
            provider: 'GCP',
            os: 'ubuntu18.04',
            name: 'container1',
            _id: null
        };
        let netQuality = {
            latency: '100ms',
            bandwidth: '5Mbps',
            name: '4G'
        };
        let node1 = {
            _id: null,
            name: 'node1',
            connections: [],
            blockchainArterfacts: [],
            resourceType: dtos_1.ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };
        let node2 = {
            _id: null,
            name: 'node2',
            connections: [],
            blockchainArterfacts: [],
            resourceType: dtos_1.ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };
        let node3 = {
            _id: null,
            name: 'node3',
            connections: [],
            blockchainArterfacts: [],
            resourceType: dtos_1.ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };
        let nodeConnection1 = {
            connectionEndpoint: node2,
            networkQuality: netQuality
        };
        let nodeConnection2 = {
            connectionEndpoint: node3,
            networkQuality: netQuality
        };
        let nodeConnection3 = {
            connectionEndpoint: node1,
            networkQuality: netQuality
        };
        node1.connections.push(nodeConnection1);
        node2.connections.push(nodeConnection2);
        node3.connections.push(nodeConnection3);
        node1 = yield nodeStructureService.create(node1);
        assert(node1);
        assert(node1._id);
        // cyclic structure
        assert(node1 == node3.connections[0].connectionEndpoint);
    }));
    it('loadStructureShouldReturnCyclicNodeStructure', () => __awaiter(this, void 0, void 0, function* () {
        let container = {
            memory: 4,
            storageSSD: 10,
            storageHDD: 0,
            vCPUcount: 2,
            provider: 'GCP',
            os: 'ubuntu18.04',
            name: 'container1',
            _id: null
        };
        let netQuality = {
            latency: '100ms',
            bandwidth: '5Mbps',
            name: '4G'
        };
        let node1 = {
            _id: null,
            name: 'node1',
            connections: [],
            blockchainArterfacts: [],
            resourceType: dtos_1.ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };
        let node2 = {
            _id: null,
            name: 'node2',
            connections: [],
            blockchainArterfacts: [],
            resourceType: dtos_1.ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };
        let node3 = {
            _id: null,
            name: 'node3',
            connections: [],
            blockchainArterfacts: [],
            resourceType: dtos_1.ResourceType.CLOUD_SERVICE,
            container: container,
            application: null
        };
        let nodeConnection1 = {
            connectionEndpoint: node2,
            networkQuality: netQuality
        };
        let nodeConnection2 = {
            connectionEndpoint: node3,
            networkQuality: netQuality
        };
        let nodeConnection3 = {
            connectionEndpoint: node1,
            networkQuality: netQuality
        };
        node1.connections.push(nodeConnection1);
        node2.connections.push(nodeConnection2);
        node3.connections.push(nodeConnection3);
        node1 = yield nodeStructureService.create(node1);
        let loadedNode = yield nodeStructureService.readStructure(node1._id);
        assert(loadedNode);
        assert(node1._id == loadedNode._id);
        // cyclic structure is correctly loaded
        assert(loadedNode.connections[0].connectionEndpoint.connections[0].connectionEndpoint.connections[0].connectionEndpoint == loadedNode);
    }));
    it('deleteNodeStructureShouldDelete', () => __awaiter(this, void 0, void 0, function* () {
        let nodeStructure = createStructureForInteraction4Large();
        nodeStructure = yield nodeStructureService.create(nodeStructure);
        yield nodeStructureService.deleteStructure(nodeStructure._id);
        let structure = yield nodeStructureService.readStructure(nodeStructure._id);
        assert(structure == null);
        yield checkDeletedStructure(nodeStructure);
    }));
    function checkCreatedAcyclicStructure(root) {
        return __awaiter(this, void 0, void 0, function* () {
            let node = yield nodeStructureService.readStructure(root._id);
            assert(node);
            assert(node._id);
            assert(node._id == root._id);
            let container = yield containerService.readOne(node.container._id);
            assert(container);
            assert(container._id == node.container._id);
            for (let artefact of node.blockchainArterfacts) {
                let readArt = yield softwareArtefactService.readOne(artefact._id);
                assert(readArt);
                assert(readArt._id == artefact._id);
            }
            if (root.connections) {
                assert(root.connections.length == node.connections.length);
                for (let connection of root.connections) {
                    let f = false;
                    for (let nodeConn of node.connections) {
                        if (nodeConn.connectionEndpoint._id == connection.connectionEndpoint._id) {
                            f = true;
                            break;
                        }
                    }
                    assert(f);
                    let peer = connection.connectionEndpoint;
                    yield checkCreatedAcyclicStructure(peer);
                }
            }
        });
    }
    function checkDeletedStructure(root) {
        return __awaiter(this, void 0, void 0, function* () {
            let node = yield nodeStructureService.readStructure(root._id);
            assert(node == null);
            // container and blockchain artefacts havent been deleted with the node
            let container = yield containerService.readOne(root.container._id);
            assert(container);
            assert(container._id == root.container._id);
            for (let artefact of root.blockchainArterfacts) {
                let readArt = yield softwareArtefactService.readOne(artefact._id);
                assert(readArt);
                assert(readArt._id == artefact._id);
            }
            if (root.connections) {
                for (let connection of root.connections) {
                    let peer = connection.connectionEndpoint;
                    yield checkDeletedStructure(peer);
                }
            }
        });
    }
});
function createStructureForInteraction4Large() {
    let netQuality = {
        name: '5G',
        bandwidth: '1Mbs',
        latency: '5ms'
    };
    let rsuMachine = {
        _id: null,
        name: 'small-machine',
        os: 'ubuntu18.04',
        provider: 'Google Cloud Platform',
        vCPUcount: 1,
        memory: 2,
        storageHDD: 0,
        storageSSD: 20
    };
    let vehicleVM = {
        _id: null,
        name: 'medium-machine',
        os: 'ubuntu18.04',
        provider: 'Google Cloud Platform',
        vCPUcount: 2,
        memory: 4,
        storageHDD: 0,
        storageSSD: 20
    };
    let edgeMachine = {
        _id: null,
        name: 'big-machine',
        os: 'ubuntu18.04',
        provider: 'Google Cloud Platform',
        vCPUcount: 4,
        memory: 8,
        storageHDD: 0,
        storageSSD: 20
    };
    let ethPeerMetada = {
        implementation: 'ethereum',
        featureName: 'creator'
    };
    let ethMinerMetadata = {
        implementation: 'ethereum',
        featureName: 'miner'
    };
    let ethPeer = {
        _id: null,
        name: 'ethereum peer',
        executionEnvironment: 'docker',
        repositoryTag: 'ethereum/client-go',
        bcMetadata: ethPeerMetada
    };
    let ethMiner = {
        _id: null,
        name: 'ethereum miner',
        executionEnvironment: 'docker',
        repositoryTag: 'ethereum/client-go',
        bcMetadata: ethMinerMetadata
    };
    let edgeProcessingApplication = null;
    let deploymentMap = {};
    deploymentMap[dtos_1.ResourceType.EDGE_SERVICE] = [ethMiner];
    deploymentMap[dtos_1.ResourceType.VEHICLE_IOT] = [ethMiner];
    deploymentMap[dtos_1.ResourceType.RSU_RESOURCE] = [ethPeer];
    let mainNode = {
        _id: null,
        resourceType: dtos_1.ResourceType.EDGE_SERVICE,
        name: "edge1",
        connections: [],
        application: edgeProcessingApplication,
        blockchainArterfacts: deploymentMap[dtos_1.ResourceType.EDGE_SERVICE],
        container: edgeMachine
    };
    let rsuNode1 = {
        _id: null,
        resourceType: dtos_1.ResourceType.RSU_RESOURCE,
        name: 'rsu1',
        connections: [],
        blockchainArterfacts: deploymentMap[dtos_1.ResourceType.RSU_RESOURCE],
        application: edgeProcessingApplication,
        container: rsuMachine
    };
    let rsuNode2 = {
        _id: null,
        resourceType: dtos_1.ResourceType.RSU_RESOURCE,
        name: 'rsu2',
        connections: [],
        blockchainArterfacts: deploymentMap[dtos_1.ResourceType.RSU_RESOURCE],
        application: edgeProcessingApplication,
        container: rsuMachine
    };
    let connection1 = {
        networkQuality: netQuality,
        connectionEndpoint: rsuNode1,
    };
    let connection2 = {
        networkQuality: netQuality,
        connectionEndpoint: rsuNode2,
    };
    for (let i = 0; i < 24; i++) {
        let peerNode = {
            _id: null,
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            connections: [],
            container: vehicleVM,
            application: edgeProcessingApplication,
            blockchainArterfacts: deploymentMap[dtos_1.ResourceType.VEHICLE_IOT]
        };
        let connection = {
            networkQuality: netQuality,
            connectionEndpoint: peerNode,
        };
        rsuNode1.connections.push(connection);
    }
    for (let i = 24; i < 48; i++) {
        let peerNode = {
            _id: null,
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            connections: [],
            container: vehicleVM,
            application: edgeProcessingApplication,
            blockchainArterfacts: deploymentMap[dtos_1.ResourceType.VEHICLE_IOT]
        };
        let connection = {
            networkQuality: netQuality,
            connectionEndpoint: peerNode,
        };
        rsuNode2.connections.push(connection);
    }
    mainNode.connections.push(connection1);
    mainNode.connections.push(connection2);
    return mainNode;
}
exports.createStructureForInteraction4Large = createStructureForInteraction4Large;
//# sourceMappingURL=NodeStructureTest.js.map