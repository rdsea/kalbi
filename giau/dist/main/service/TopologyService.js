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
const ServiceException_1 = require("./ServiceException");
const PersistenceException_1 = require("../repository/PersistenceException");
const TopologyValidation_1 = require("../validation/TopologyValidation");
class TopologyService {
    constructor(repository, nodeStructureService, logger) {
        this.repository = repository;
        this.nodeStructureService = nodeStructureService;
        this.logger = logger;
    }
    create(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                TopologyValidation_1.TopologyValidation.validate(topology);
                this.logger.info('Creating new Topology, caption = ' + topology.caption);
                let structure = yield this.nodeStructureService.create(topology.structure);
                topology.structure = structure;
                let topologyDataModel = this.repository.DtoToModel(topology);
                topologyDataModel = yield this.repository.create(topologyDataModel);
                topology._id = topologyDataModel._id.toHexString();
                this.logger.info('Created Topology, id = ' + topology._id);
                return topology;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('Topology hasnt been created');
                }
                else {
                    throw e;
                }
            }
        });
    }
    readOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let topologyDataModel = yield this.repository.readOneById(id);
                if (!topologyDataModel) {
                    return null;
                }
                let structure = yield this.nodeStructureService.readStructure(topologyDataModel.structure_root_node_id.toHexString());
                if (!structure) {
                    yield this.delete(id);
                    return null;
                }
                let topology = {
                    _id: topologyDataModel._id.toHexString(),
                    caption: topologyDataModel.caption,
                    specification: topologyDataModel.specification,
                    specificationLang: topologyDataModel.specificationLang,
                    structure: structure
                };
                return topology;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    return null;
                }
                else {
                    throw e;
                }
            }
        });
    }
    readAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let topologyDataModels = yield this.repository.readAll();
                if (!topologyDataModels) {
                    return [];
                }
                let topologies = [];
                for (let topologyDM of topologyDataModels) {
                    let topology = yield this.readOne(topologyDM._id.toHexString());
                    topologies.push(topology);
                }
                return topologies;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    return [];
                }
                else {
                    throw e;
                }
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Removing Topology with ID = ' + id);
            let topologyDataModel = yield this.repository.readOneById(id);
            if (!topologyDataModel) {
                this.logger.debug(`No Topology with ID = ${id} found, nothing to remove`);
                return;
            }
            try {
                yield this.nodeStructureService.deleteStructure(topologyDataModel.structure_root_node_id.toHexString());
            }
            catch (e) {
            }
            try {
                yield this.repository.delete(id);
                this.logger.info(`Removed Topology with id = ${id}`);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('Topology hasnt been removed');
                }
                else {
                    throw e;
                }
            }
        });
    }
}
exports.TopologyService = TopologyService;
//# sourceMappingURL=TopologyService.js.map