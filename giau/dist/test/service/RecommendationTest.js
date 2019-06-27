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
describe('RecommendationService tests', () => {
    let dependecnyInjection = new DependencyInjection_1.DependencyInjection();
    let topologyService = null;
    let experimentService = null;
    let depPatternService = null;
    let recommendationService = null;
    before(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.createConnection();
        topologyService = dependecnyInjection.createTopologyService();
        experimentService = dependecnyInjection.createExperimentService();
        depPatternService = dependecnyInjection.createDeploymentPatternService();
        recommendationService = dependecnyInjection.createRecommendationService();
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
        yield dependecnyInjection.createGraphAPI().makeGraphRequest('MATCH (n) DETACH DELETE n');
    }));
    it('findMostSimilarDeploymentPatternShouldReturnNull', () => __awaiter(this, void 0, void 0, function* () {
        let mostSimilar = yield recommendationService.findMostSimilarDeploymentPattern(createDeploymentPatternLarge1().structure);
        assert(mostSimilar == null);
    }));
    it('findMostSimilarDeploymentPatternShouldReturnPatternEqual', () => __awaiter(this, void 0, void 0, function* () {
        let small1 = yield depPatternService.create(createDeploymentPatternSmall1());
        let small2 = yield depPatternService.create(createDeploymentPatternSmall2());
        let small3 = yield depPatternService.create(createDeploymentPatternSmall3());
        let large1 = yield depPatternService.create(createDeploymentPatternLarge1());
        let large2 = yield depPatternService.create(createDeploymentPatternLarge2());
        let large3 = yield depPatternService.create(createDeploymentPatternLarge3());
        let mostSimilar = yield recommendationService.findMostSimilarDeploymentPattern(createDeploymentPatternSmall1().structure);
        assert(mostSimilar._id == small1._id);
        mostSimilar = yield recommendationService.findMostSimilarDeploymentPattern(createDeploymentPatternSmall2().structure);
        assert(mostSimilar._id == small2._id);
        mostSimilar = yield recommendationService.findMostSimilarDeploymentPattern(createDeploymentPatternSmall3().structure);
        assert(mostSimilar._id == small3._id);
        mostSimilar = yield recommendationService.findMostSimilarDeploymentPattern(createDeploymentPatternLarge1().structure);
        assert(mostSimilar._id == large1._id);
        mostSimilar = yield recommendationService.findMostSimilarDeploymentPattern(createDeploymentPatternLarge2().structure);
        assert(mostSimilar._id == large2._id);
        mostSimilar = yield recommendationService.findMostSimilarDeploymentPattern(createDeploymentPatternLarge3().structure);
        assert(mostSimilar._id == large3._id);
    }));
    it('findMostSimilarDeploymentPatternShouldReturnSimilar', () => __awaiter(this, void 0, void 0, function* () {
        let small1 = yield depPatternService.create(createDeploymentPatternSmall1());
        let small2 = yield depPatternService.create(createDeploymentPatternSmall2());
        let small3 = yield depPatternService.create(createDeploymentPatternSmall3());
        let large1 = yield depPatternService.create(createDeploymentPatternLarge1());
        let large2 = yield depPatternService.create(createDeploymentPatternLarge2());
        let large3 = yield depPatternService.create(createDeploymentPatternLarge3());
        let structure = {
            resourceType: dtos_1.ResourceType.EDGE_SERVICE,
            name: 'edge1',
            peers: []
        };
        let rsu = {
            resourceType: dtos_1.ResourceType.RSU_RESOURCE,
            name: 'rsu1',
            peers: []
        };
        let rsu2 = {
            resourceType: dtos_1.ResourceType.RSU_RESOURCE,
            name: 'rsu2',
            peers: []
        };
        let vehicle = {
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: 'vehicle1',
            peers: []
        };
        rsu2.peers.push(vehicle);
        rsu.peers.push(rsu2);
        structure.peers.push(rsu);
        let mostSimilar = yield recommendationService.findMostSimilarDeploymentPattern(structure);
        assert(mostSimilar);
        assert(mostSimilar._id == small3._id);
    }));
});
function createDeploymentPatternSmall1() {
    let mainNode = {
        name: "rsu2",
        resourceType: dtos_1.ResourceType.RSU_RESOURCE,
        peers: []
    };
    for (let i = 0; i < 2; i++) {
        let peerNode = {
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            peers: []
        };
        mainNode.peers.push(peerNode);
    }
    let deploymentPattern = {
        _id: null,
        name: 'Deployment pattern small 1',
        structure: mainNode
    };
    return deploymentPattern;
}
exports.createDeploymentPatternSmall1 = createDeploymentPatternSmall1;
function createDeploymentPatternLarge1() {
    let mainNode = {
        name: "rsu2",
        resourceType: dtos_1.ResourceType.RSU_RESOURCE,
        peers: []
    };
    for (let i = 0; i < 48; i++) {
        let peerNode = {
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            peers: []
        };
        mainNode.peers.push(peerNode);
    }
    let deploymentPattern = {
        _id: null,
        name: 'Deployment pattern for Scenario 2 Case 2 Large scale',
        structure: mainNode
    };
    return deploymentPattern;
}
exports.createDeploymentPatternLarge1 = createDeploymentPatternLarge1;
function createDeploymentPatternSmall2() {
    let mainNode = {
        name: "edge1",
        resourceType: dtos_1.ResourceType.EDGE_SERVICE,
        peers: []
    };
    for (let i = 0; i < 2; i++) {
        let peerNode = {
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            peers: []
        };
        mainNode.peers.push(peerNode);
    }
    let deploymentPattern = {
        _id: null,
        name: 'Deployment pattern for Scenario 2 Case 3 Small scale',
        structure: mainNode
    };
    return deploymentPattern;
}
exports.createDeploymentPatternSmall2 = createDeploymentPatternSmall2;
function createDeploymentPatternLarge2() {
    let mainNode = {
        name: "edge1",
        resourceType: dtos_1.ResourceType.EDGE_SERVICE,
        peers: []
    };
    for (let i = 0; i < 48; i++) {
        let peerNode = {
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            peers: []
        };
        mainNode.peers.push(peerNode);
    }
    let deploymentPattern = {
        _id: null,
        name: 'Deployment pattern for Scenario 2 Case 3 Large scale',
        structure: mainNode
    };
    return deploymentPattern;
}
exports.createDeploymentPatternLarge2 = createDeploymentPatternLarge2;
function createDeploymentPatternSmall3() {
    let mainNode = {
        name: "edge1",
        resourceType: dtos_1.ResourceType.EDGE_SERVICE,
        peers: []
    };
    let rsuNode1 = {
        name: "rsu1",
        resourceType: dtos_1.ResourceType.RSU_RESOURCE,
        peers: []
    };
    let rsuNode2 = {
        name: "rsu2",
        resourceType: dtos_1.ResourceType.RSU_RESOURCE,
        peers: []
    };
    let peerNode1 = {
        resourceType: dtos_1.ResourceType.VEHICLE_IOT,
        name: `vehicle1`,
        peers: []
    };
    let peerNode2 = {
        resourceType: dtos_1.ResourceType.VEHICLE_IOT,
        name: `vehicle2`,
        peers: []
    };
    rsuNode1.peers.push(peerNode1);
    rsuNode2.peers.push(peerNode2);
    mainNode.peers.push(rsuNode1);
    mainNode.peers.push(rsuNode2);
    let deploymentPattern = {
        _id: null,
        name: 'Deployment pattern for Scenario 2 Case 4 Small scale',
        structure: mainNode
    };
    return deploymentPattern;
}
exports.createDeploymentPatternSmall3 = createDeploymentPatternSmall3;
function createDeploymentPatternLarge3() {
    let mainNode = {
        name: "edge1",
        resourceType: dtos_1.ResourceType.EDGE_SERVICE,
        peers: []
    };
    let rsuNode1 = {
        name: "rsu1",
        resourceType: dtos_1.ResourceType.RSU_RESOURCE,
        peers: []
    };
    let rsuNode2 = {
        name: "rsu2",
        resourceType: dtos_1.ResourceType.RSU_RESOURCE,
        peers: []
    };
    for (let i = 0; i < 24; i++) {
        let peerNode = {
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            peers: []
        };
        rsuNode1.peers.push(peerNode);
    }
    for (let i = 24; i < 48; i++) {
        let peerNode = {
            resourceType: dtos_1.ResourceType.VEHICLE_IOT,
            name: `vehicle${i + 1}`,
            peers: []
        };
        rsuNode2.peers.push(peerNode);
    }
    mainNode.peers.push(rsuNode1);
    mainNode.peers.push(rsuNode2);
    let deploymentPattern = {
        _id: null,
        name: 'Deployment pattern for Scenario 2 Case 4 Large scale',
        structure: mainNode
    };
    return deploymentPattern;
}
exports.createDeploymentPatternLarge3 = createDeploymentPatternLarge3;
//# sourceMappingURL=RecommendationTest.js.map