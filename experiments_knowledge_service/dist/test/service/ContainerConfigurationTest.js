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
const ServiceException_1 = require("../../main/service/ServiceException");
const assert = require('assert');
describe('ContainerConfigurationService tests', () => {
    let dependecnyInjection = new DependencyInjection_1.DependencyInjection();
    let containerConfigurationService = null;
    before(() => __awaiter(this, void 0, void 0, function* () {
        let mongoDb = yield dependecnyInjection.createMongoDB();
        yield mongoDb.createConnection();
        containerConfigurationService = dependecnyInjection.createContainerConfigurationService();
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
    it('createShouldReturnCreatedContainerConfiguration', () => __awaiter(this, void 0, void 0, function* () {
        let container = {
            _id: null,
            vCPUcount: 4,
            storageSSD: 20,
            storageHDD: 20,
            provider: 'AWS',
            os: 'ubuntu',
            name: 'medium-machine',
            memory: 16
        };
        let created = yield containerConfigurationService.create(container);
        let readContainer = yield containerConfigurationService.readOne(created._id);
        assert(created);
        assert(readContainer);
        assert(created._id === readContainer._id);
    }));
    it('createShouldReturnExistingContainerConfiguration', () => __awaiter(this, void 0, void 0, function* () {
        let containerOriginal = {
            _id: null,
            vCPUcount: 4,
            storageSSD: 20,
            storageHDD: 20,
            provider: 'AWS',
            os: 'ubuntu',
            name: 'medium-machine',
            memory: 16
        };
        let containerDuplicate = {
            _id: null,
            vCPUcount: 4,
            storageSSD: 20,
            storageHDD: 20,
            provider: 'AWS',
            os: 'ubuntu',
            name: 'other-machine',
            memory: 16
        };
        let created = yield containerConfigurationService.create(containerOriginal);
        let existing = yield containerConfigurationService.create(containerDuplicate);
        assert(created);
        assert(existing);
        assert(created._id === existing._id);
    }));
    it('readOneShouldReturnNothing', () => __awaiter(this, void 0, void 0, function* () {
        let container = {
            _id: null,
            vCPUcount: 4,
            storageSSD: 20,
            storageHDD: 20,
            provider: 'AWS',
            os: 'ubuntu',
            name: 'medium-machine',
            memory: 16
        };
        container = yield containerConfigurationService.create(container);
        yield containerConfigurationService.delete(container._id);
        container = yield containerConfigurationService.readOne(container._id);
        assert(container == null);
    }));
    it('readAllShouldReturnAllContainers', () => __awaiter(this, void 0, void 0, function* () {
        let container = {
            _id: null,
            vCPUcount: 4,
            storageSSD: 20,
            storageHDD: 20,
            provider: 'AWS',
            os: 'ubuntu',
            name: 'medium-machine',
            memory: 16
        };
        let containers = yield containerConfigurationService.readAll();
        assert(containers);
        let oldCount = containers.length;
        for (let i = 0; i < 3; i++) {
            container.storageHDD = 20 * i + 5;
            yield containerConfigurationService.create(container);
        }
        containers = yield containerConfigurationService.readAll();
        assert(oldCount + 3 === containers.length);
    }));
    it('deleteContainerShouldDelete', () => __awaiter(this, void 0, void 0, function* () {
        let container = {
            _id: null,
            vCPUcount: 4,
            storageSSD: 20,
            storageHDD: 20,
            provider: 'GCP',
            os: 'ubuntu',
            name: 'medium-machine',
            memory: 32
        };
        container = yield containerConfigurationService.create(container);
        let containers = yield containerConfigurationService.readAll();
        let oldCount = containers.length;
        yield containerConfigurationService.delete(container._id);
        container = yield containerConfigurationService.readOne(container._id);
        assert(container == null);
        containers = yield containerConfigurationService.readAll();
        assert(oldCount - 1 === containers.length);
    }));
    it('deleteContainerShouldThrowServiceException', () => __awaiter(this, void 0, void 0, function* () {
        //using invalid ObjectId here
        try {
            yield containerConfigurationService.delete('a');
            assert(false);
        }
        catch (e) {
            if (e instanceof ServiceException_1.ServiceException) {
                assert(true);
            }
            else {
                assert(false);
            }
        }
        // expect(containerConfigurationService.delete('a')).to.throw('No ContainerConfiguration has been removed');
    }));
});
