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
const NodeStructureTest_1 = require("./NodeStructureTest");
const assert = require('assert');
describe('Topology tests', () => {
    let dependecnyInjection = new DependencyInjection_1.DependencyInjection();
    let nodeStructureService = null;
    let topologyService = null;
    before(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.createConnection();
        nodeStructureService = dependecnyInjection.createNodeStructureService();
        topologyService = dependecnyInjection.createTopologyService();
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
    it('createShouldReturnCreatedTopology', () => __awaiter(this, void 0, void 0, function* () {
        let topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        topology = yield topologyService.create(topology);
        let structure = yield nodeStructureService.readStructure(topology.structure._id);
        assert(topology);
        assert(topology._id);
        assert(structure);
        assert(structure._id == topology.structure._id);
        let topologyRead = yield topologyService.readOne(topology._id);
        assert(topology._id == topologyRead._id);
    }));
    it('deleteShouldDeleteTopology', () => __awaiter(this, void 0, void 0, function* () {
        let topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: NodeStructureTest_1.createStructureForInteraction4Large()
        };
        topology = yield topologyService.create(topology);
        yield topologyService.delete(topology._id);
        let structure = yield nodeStructureService.readStructure(topology.structure._id);
        // underlying structure is deleted
        assert(structure == null);
    }));
});
//# sourceMappingURL=TopologyTest.js.map