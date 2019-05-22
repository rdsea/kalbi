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
const types_1 = require("./types");
const fs = require("fs");
const request = require("request");
class PrecisionRecallEvaluator {
    constructor(logger) {
        this.logger = logger;
    }
    runTesting() {
        return __awaiter(this, void 0, void 0, function* () {
            let filenames = fs.readdirSync('emulated_data');
            for (let i = 0; i < filenames.length; i++) {
                let content = filenames[i];
                this.logger.info(`Reading PureNode from emulated_data/${content}`);
                let contentString = fs.readFileSync('emulated_data/' + content).toString();
                let experiment = JSON.parse(contentString);
                this.logger.info(`Loaded topology with id = ${experiment.topology.caption}`);
                let pureTree = this.createPureNodeFromNode(experiment.topology.structure);
                this.logger.info(`Obtaining recommendation based on the read PureNode...`);
                let recommendedTopology = yield this.obtainRecommendedTopology(pureTree);
                let recommendedPureNode = this.createPureNodeFromNode(recommendedTopology.structure);
                this.logger.info(`Topology ${recommendedTopology.caption} has been returned by GIAU`);
                let equals = this.equalsPureNodes(pureTree, recommendedPureNode);
                if (equals) {
                    this.logger.info('OK!');
                }
                else {
                    this.logger.info('NOT MATCHED!');
                }
            }
        });
    }
    obtainRecommendedTopology(pureNode) {
        return __awaiter(this, void 0, void 0, function* () {
            let options = {
                method: 'POST',
                url: `http://localhost:9000/api/v1/recommendTopology?syncPrior=5&txAcceptRate=4&txAcceptTime=3&infRes=2`,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: pureNode,
                json: true
            };
            return new Promise((resolve, reject) => {
                request.post(options, (error, response, body) => {
                    if (error) {
                        reject('Topology cannot be recommended due to following error: ' + error);
                    }
                    if (response) {
                        resolve(response.body);
                    }
                });
            });
        });
    }
    createPureNodeFromNode(node) {
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
        let id = types_1.NodeType[node.nodeType] + this.makeid(5);
        let pureNode = {
            name: id,
            nodeType: node.nodeType,
            peers: purePeers
        };
        return pureNode;
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
            return `${types_1.NodeType[tree.nodeType]}${level}`;
        }
        else {
            anchestorsInString.sort((one, two) => (one > two ? -1 : 1));
            return `${types_1.NodeType[tree.nodeType]}${level}-${anchestorsInString.join('-')}`;
        }
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
}
exports.PrecisionRecallEvaluator = PrecisionRecallEvaluator;
//# sourceMappingURL=PrecisionRecallEvaluator.js.map