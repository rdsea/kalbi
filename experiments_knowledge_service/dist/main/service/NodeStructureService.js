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
const mongodb_1 = require("mongodb");
const ServiceException_1 = require("./ServiceException");
const PersistenceException_1 = require("../repository/PersistenceException");
const NodeStructureValidation_1 = require("../validation/NodeStructureValidation");
class NodeStructureService {
    constructor(repository, softwareArterfactsService, vmService, logger) {
        this.repository = repository;
        this.softwareArterfactsService = softwareArterfactsService;
        this.vmService = vmService;
        this.logger = logger;
        // private visitedNode = {};
        this.nodeIdToNodeMap = {};
    }
    create(rootNodeOfStructure) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                NodeStructureValidation_1.NodeStructureValidation.validate(rootNodeOfStructure);
                this.logger.info(`Creating Structure with root Node, name = ${rootNodeOfStructure.name}`);
                // this.visitedNode = {};
                rootNodeOfStructure = yield this.createStructure(rootNodeOfStructure);
                // this.visitedNode = {};
                yield this.saveStructureRelationships(rootNodeOfStructure);
                this.logger.info(`Created Structure with root Node, id = ${rootNodeOfStructure._id}.`);
                return rootNodeOfStructure;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException(`Node hasn't been created.`);
                }
                else {
                    throw e;
                }
            }
        });
    }
    saveStructureRelationships(root) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (this.visitedNode[root._id]) {
            //     return;
            // }
            // this.visitedNode[root._id] = true;
            let nodeModel = yield this.repository.readOneById(root._id);
            let connections = [];
            if (root.connections) {
                for (let connection of root.connections) {
                    let nodeConnDataModel = {
                        networkQuality: connection.networkQuality,
                        endpoint_id: new mongodb_1.ObjectId(connection.connectionEndpoint._id)
                    };
                    connections.push(nodeConnDataModel);
                }
                nodeModel.connections = connections;
                yield this.repository.update(root._id, nodeModel);
                for (let connection of root.connections) {
                    yield this.saveStructureRelationships(connection.connectionEndpoint);
                }
            }
        });
    }
    createStructure(root) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (this.visitedNode[root._id]) {
            //     this.logger.info('node already visited');
            //     return root;
            // }
            // this.visitedNode[root._id] = true;
            this.logger.debug(`Creating structure of Node with id = ${root.name}`);
            if (root.connections) {
                for (let connection of root.connections) {
                    let peer = connection.connectionEndpoint;
                    peer = yield this.createStructure(peer);
                }
            }
            return yield this.saveNode(root);
        });
    }
    saveNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            let bcArtefactsIds = [];
            let applicationId = null;
            let blockchainArtefacts = [];
            if (node.blockchainArterfacts) {
                for (let bcArtefacts of node.blockchainArterfacts) {
                    bcArtefacts = (yield this.softwareArterfactsService.create(bcArtefacts));
                    bcArtefactsIds.push(new mongodb_1.ObjectId(bcArtefacts._id));
                    blockchainArtefacts.push(bcArtefacts);
                }
            }
            node.blockchainArterfacts = blockchainArtefacts;
            if (node.application) {
                let softArtefact = yield this.softwareArterfactsService.create(node.application);
                applicationId = new mongodb_1.ObjectId(softArtefact._id);
                node.application = softArtefact;
            }
            node.container = yield this.vmService.create(node.container);
            let nodeDataModel = {
                application: applicationId,
                blockchainArterfacts: bcArtefactsIds,
                connections: [],
                container_id: new mongodb_1.ObjectId(node.container._id),
                name: node.name,
                nodeType: node.nodeType,
                _id: null
            };
            nodeDataModel = yield this.repository.create(nodeDataModel);
            node._id = nodeDataModel._id.toHexString();
            this.logger.info(`Saved node with id = ${node._id}`);
            return node;
        });
    }
    readStructure(rootNodeOfStructureId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.nodeIdToNodeMap = {};
                return yield this.buildStructureOfRoot(rootNodeOfStructureId);
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
    buildStructureOfRoot(rootNodeOfStructureId) {
        return __awaiter(this, void 0, void 0, function* () {
            let rootDataModel = yield this.repository.readOneByIdWithArtefacts(rootNodeOfStructureId);
            if (!rootDataModel) {
                return null;
            }
            if (this.nodeIdToNodeMap[rootNodeOfStructureId]) {
                return this.nodeIdToNodeMap[rootNodeOfStructureId];
            }
            let node = {
                _id: rootDataModel._id.toHexString(),
                nodeType: rootDataModel.nodeType,
                name: rootDataModel.name,
                container: rootDataModel.container,
                blockchainArterfacts: rootDataModel.blockchainArterfacts,
                application: rootDataModel.application,
                connections: []
            };
            this.nodeIdToNodeMap[node._id] = node;
            if (rootDataModel.connections) {
                for (let connectionDataModel of rootDataModel.connections) {
                    let endpoint = yield this.buildStructureOfRoot(connectionDataModel.endpoint_id.toHexString());
                    if (endpoint) {
                        let nodeAssociation = {
                            networkQuality: connectionDataModel.networkQuality,
                            connectionEndpoint: endpoint
                        };
                        node.connections.push(nodeAssociation);
                    }
                }
            }
            return node;
        });
    }
    deleteStructure(rootNodeOfStructureId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug(`Removing Node with id = ${rootNodeOfStructureId}`);
            let nodeDataModel = null;
            try {
                nodeDataModel = yield this.repository.readOneById(rootNodeOfStructureId);
            }
            catch (e) {
            }
            if (!nodeDataModel) {
                this.logger.debug(`No Node with id = ${rootNodeOfStructureId} found, nothing to remove`);
                return;
            }
            try {
                yield this.delete(rootNodeOfStructureId);
            }
            catch (e) {
            }
            this.logger.info(`Removed Node with id = ${rootNodeOfStructureId}`);
            for (let connection of nodeDataModel.connections) {
                let child_id = connection.endpoint_id.toHexString();
                yield this.deleteStructure(child_id);
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.repository.delete(id);
        });
    }
}
exports.NodeStructureService = NodeStructureService;
