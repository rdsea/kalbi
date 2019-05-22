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
const dtos_1 = require("../model/dtos");
const ServiceException_1 = require("./ServiceException");
const PersistenceException_1 = require("../repository/PersistenceException");
const DeploymentPatternValidation_1 = require("../validation/DeploymentPatternValidation");
class DeploymentPatternService {
    // private visited = {};
    constructor(repository, logger) {
        this.repository = repository;
        this.logger = logger;
    }
    create(depPattern) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                DeploymentPatternValidation_1.DeploymentPatternValidation.validate(depPattern);
                depPattern = yield this.repository.create(depPattern);
                this.logger.info(`Created DeploymentPattern with id = ${depPattern._id} in repository`);
                return depPattern;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('DeploymentPattern hasnt been created');
                }
                else {
                    throw e;
                }
            }
        });
    }
    createFromExperiment(experiment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let topology = experiment.topology;
                // this.visited = {};
                let rootNode = this.createPureNodeFromNode(topology.structure);
                let allDepPatterns = yield this.readAll();
                this.logger.info('Looking for the DeploymentPattern structure in repository...');
                if (allDepPatterns) {
                    for (let depPattern of allDepPatterns) {
                        let patternRootNode = depPattern.structure;
                        if (this.equalsPureNodes(rootNode, patternRootNode)) {
                            this.logger.info(`DeploymentPattern structure already exists (id = ${patternRootNode.name}), returning`);
                            return depPattern;
                        }
                    }
                }
                this.logger.info('DeploymentPattern not found, its going to be created');
                let name = 'deployment pattern';
                if (experiment.depPattern && experiment.depPattern.name) {
                    name = experiment.depPattern.name;
                }
                let depPattern = {
                    structure: rootNode,
                    name: name,
                    _id: null
                };
                return yield this.create(depPattern);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('DeploymentPattern hasnt been created');
                }
                else {
                    throw e;
                }
            }
        });
    }
    equalsPureNodes(nodeA, nodeB) {
        let nodeAStr = this.createStringRepresentationOfTree(nodeA, 0);
        let nodeBStr = this.createStringRepresentationOfTree(nodeB, 0);
        return nodeAStr === nodeBStr;
    }
    createStringRepresentationOfTree(tree, level) {
        let anchestorsInString = [];
        for (let child of tree.peers) {
            let strRepre = this.createStringRepresentationOfTree(child, level + 1);
            anchestorsInString.push(strRepre);
        }
        if (anchestorsInString.length == 0) {
            return `${dtos_1.NodeType[tree.nodeType]}${level}`;
        }
        else {
            anchestorsInString.sort((one, two) => (one > two ? -1 : 1));
            return `${dtos_1.NodeType[tree.nodeType]}${level}-${anchestorsInString.join('-')}`;
        }
    }
    createPureNodeFromNode(node) {
        // if (this.visited[node.name]) {
        //     return;
        // }
        // this.visited[node.name] = true;
        let purePeers = [];
        if (node.connections) {
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                let purePeer = this.createPureNodeFromNode(peer);
                if (purePeer) {
                    purePeers.push(purePeer);
                }
            }
        }
        let id = dtos_1.NodeType[node.nodeType] + this.makeid(5);
        let pureNode = {
            name: id,
            nodeType: node.nodeType,
            peers: purePeers
        };
        return pureNode;
    }
    makeid(length) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    readAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.repository.readAll();
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
    readOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.repository.readOneById(id);
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
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.repository.delete(id);
                this.logger.info(`Removed DeploymentPattern with ID = ${id}`);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('DeploymentPattern hasnt been deleted');
                }
                else {
                    throw e;
                }
            }
        });
    }
}
exports.DeploymentPatternService = DeploymentPatternService;
