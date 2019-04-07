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
const assert = require('assert');
describe('SoftwareArtefact tests', () => {
    let dependecnyInjection = new DependencyInjection_1.DependencyInjection();
    let artefactService = null;
    before(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.createConnection();
        artefactService = dependecnyInjection.createSoftwareArtefactsService();
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
    it('createArtefactShouldReturnCreatedArtefact', () => __awaiter(this, void 0, void 0, function* () {
        let ethPeerMetada = {
            implementation: 'ethereum',
            featureName: 'creator'
        };
        let ethPeer = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };
        let artefact = yield artefactService.create(ethPeer);
        let readArtefact = yield artefactService.readOne(artefact._id);
        assert(artefact);
        assert(readArtefact);
        assert(artefact._id === readArtefact._id);
        assert(artefact.bcMetadata.featureName === readArtefact.bcMetadata.featureName);
        assert(artefact.bcMetadata.implementation === readArtefact.bcMetadata.implementation);
    }));
    it('createArtefactShouldReturnExistingArtefact', () => __awaiter(this, void 0, void 0, function* () {
        let ethPeerMetada = {
            implementation: 'ethereum',
            featureName: 'creator'
        };
        let ethPeer = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };
        let ethPeerDuplicate = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };
        let artefact = yield artefactService.create(ethPeer);
        let artefactDuplicate = yield artefactService.create(ethPeerDuplicate);
        assert(artefact);
        assert(artefactDuplicate);
        assert(artefact._id === artefactDuplicate._id);
        assert(artefact.bcMetadata.featureName === artefactDuplicate.bcMetadata.featureName);
        assert(artefact.bcMetadata.implementation === artefactDuplicate.bcMetadata.implementation);
    }));
    it('readAllArtefactsShouldReturnAll', () => __awaiter(this, void 0, void 0, function* () {
        let ethPeerMetada = {
            implementation: 'ethereum',
            featureName: 'creator'
        };
        let ethPeer = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };
        let artefacts = yield artefactService.readAll();
        let oldCount = artefacts.length;
        for (let i = 0; i < 3; i++) {
            let ethPeer = {
                _id: null,
                name: 'ethereum peer',
                executionEnvironment: 'docker' + i,
                repositoryTag: 'ethereum/client-go',
                bcMetadata: ethPeerMetada
            };
            yield artefactService.create(ethPeer);
        }
        artefacts = yield artefactService.readAll();
        assert(artefacts.length == oldCount + 3);
    }));
    it('deleteArtefactShouldDeleteArtefact', () => __awaiter(this, void 0, void 0, function* () {
        let ethPeerMetada = {
            implementation: 'ethereum',
            featureName: 'creator'
        };
        let ethPeer = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };
        let artefact = yield artefactService.create(ethPeer);
        let artefacts = yield artefactService.readAll();
        let oldCount = artefacts.length;
        yield artefactService.delete(artefact._id);
        artefact = (yield artefactService.readOne(artefact._id));
        assert(artefact == null);
        artefacts = yield artefactService.readAll();
        assert(artefacts);
        assert(artefacts.length + 1 == oldCount);
    }));
});
