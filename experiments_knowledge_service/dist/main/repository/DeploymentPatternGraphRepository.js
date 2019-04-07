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
const crypto = require("crypto");
const PersistenceException_1 = require("./PersistenceException");
class DeploymentPatternGraphRepository {
    constructor(graphDB, logger) {
        this.graphDB = graphDB;
        this.logger = logger;
        this.visitedNode = {};
    }
    create(dataModel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.visitedNode = {};
                this.createNodesCypher = '';
                this.createRelsCypher = '';
                this.createGraphTopologyRec(dataModel.structure);
                let hashedValue = crypto.createHmac('sha256', '1234567890')
                    .update(JSON.stringify(dataModel))
                    .digest('base64');
                let createDepPatternQuery = `CREATE (depPattern: DeploymentPattern {id: '${hashedValue}', name: 'Deployment Pattern', description: '${dataModel.name}'})`;
                let createConnectionToStructureQuery = `CREATE (depPattern)-[:HAS_STRUCTURE]->(${dataModel.structure.name})`;
                let graphRequest = this.createNodesCypher + '\n' + createDepPatternQuery + '\n' + this.createRelsCypher + '\n' + createConnectionToStructureQuery;
                yield this.graphDB.makeGraphRequest(graphRequest);
                dataModel._id = hashedValue;
                return dataModel;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    createGraphTopologyRec(node) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;
        let nodeTypeString = dtos_1.NodeType[node.nodeType];
        nodeTypeString = this.capitalizeFirstLetter(nodeTypeString);
        let createNodeCypher = `CREATE (${node.name}:${nodeTypeString} {name: '${node.name}', nodeType: '${dtos_1.NodeType[node.nodeType]}'})`;
        this.createNodesCypher = this.createNodesCypher + createNodeCypher + '\n';
        for (let peer of node.peers) {
            let peerTypeString = dtos_1.NodeType[peer.nodeType];
            peerTypeString = this.capitalizeFirstLetter(peerTypeString);
            let createRelCypher = `CREATE (${node.name})-[:CONNECTED_TO]->(${peer.name})`;
            this.createRelsCypher = this.createRelsCypher + createRelCypher + '\n';
            this.createGraphTopologyRec(peer);
        }
    }
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    delete(id) {
    }
    readOneById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let query = 'MATCH path = (dep:DeploymentPattern{id:\'' + id + '\'})-[:HAS_STRUCTURE]-(m)-[:CONNECTED_TO*]-(n)\n' +
                    'WITH collect(path) as paths\n' +
                    'CALL apoc.convert.toTree(paths) yield value\n' +
                    'RETURN value;';
                let result = yield this.graphDB.makeGraphRequest(query);
                if (!result.records || result.records.length == 0) {
                    return null;
                }
                return this.createDeploymentPatternFromGraphResponse(result.records[0]);
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    readAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let allPatterns = [];
                let query = 'MATCH path = (dep:DeploymentPattern{})-[:HAS_STRUCTURE]-(m)-[:CONNECTED_TO*]-(n)\n' +
                    'WITH collect(path) as paths\n' +
                    'CALL apoc.convert.toTree(paths) yield value\n' +
                    'RETURN value;';
                let result = yield this.graphDB.makeGraphRequest(query);
                for (let record of result.records) {
                    let depPattern = this.createDeploymentPatternFromGraphResponse(record);
                    if (depPattern) {
                        allPatterns.push(depPattern);
                    }
                }
                return allPatterns;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    createDeploymentPatternFromGraphResponse(record) {
        let fields = record._fields[0];
        if (!fields || !fields._id || !fields.has_structure) {
            return null;
        }
        let depPattern = {
            name: fields.name,
            _id: fields.id,
            structure: this.createPureNodeFromGraphResponse(fields.has_structure[0])
        };
        return depPattern;
    }
    createPureNodeFromGraphResponse(resp) {
        let peers = [];
        if (resp.connected_to) {
            for (let rawNode of resp.connected_to) {
                let pureNode = this.createPureNodeFromGraphResponse(rawNode);
                peers.push(pureNode);
            }
        }
        let type = null;
        if (resp.nodeType === 'vehicle') {
            type = dtos_1.NodeType.vehicle;
        }
        else if (resp.nodeType === 'rsu') {
            type = dtos_1.NodeType.rsu;
        }
        else if (resp.nodeType === 'edge') {
            type = dtos_1.NodeType.edge;
        }
        else if (resp.nodeType === 'cloud') {
            type = dtos_1.NodeType.cloud;
        }
        let pureNode = {
            name: resp.name,
            peers: peers,
            nodeType: type
        };
        return pureNode;
    }
    update(id, data) {
        return undefined;
    }
}
exports.DeploymentPatternGraphRepository = DeploymentPatternGraphRepository;
