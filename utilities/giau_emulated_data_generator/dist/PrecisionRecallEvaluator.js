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
const random = require("random");
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
    buildConfusionMatrix() {
        return __awaiter(this, void 0, void 0, function* () {
            let filenames = fs.readdirSync('emulated_data');
            let confusionMatrix = new Array(10).fill(0).map(() => new Array(10).fill(0));
            for (let i = 0; i < filenames.length; i++) {
                let content = filenames[i];
                let contentString = fs.readFileSync('emulated_data/' + content).toString();
                let experiment = JSON.parse(contentString);
                let pureTree = this.createPureNodeFromNode(experiment.topology.structure);
                this.cutTreeFromLevel(1, pureTree);
                // check whether the "cut" trees represented by pureNode have been correctly predicted
                yield this.determinePredictedTopology(pureTree, i, confusionMatrix);
                for (let n = 0; n < 4; n++) {
                    let actualPureNodeCopy = JSON.parse(JSON.stringify(pureTree).toString());
                    // append 3 random nodes to the cut tree
                    this.appendRandomNodesToPureNode(actualPureNodeCopy, 3);
                    // should be correctly predicted to the i-th topology
                    yield this.determinePredictedTopology(actualPureNodeCopy, i, confusionMatrix);
                }
            }
            this.logger.info("CONFUSION MATRIX:");
            for (let i = 0; i < confusionMatrix.length; i++) {
                let row = '';
                for (let j = 0; j < confusionMatrix[i].length; j++) {
                    row = row + confusionMatrix[i][j] + ' ';
                }
                this.logger.info(row);
            }
        });
    }
    determinePredictedTopology(actualPureNode, actualPureNodeIndex, confusionMatrix) {
        return __awaiter(this, void 0, void 0, function* () {
            let filenames = fs.readdirSync('emulated_data');
            let predictedTopology = yield this.obtainRecommendedTopology(actualPureNode);
            for (let j = 0; j < filenames.length; j++) {
                let actual = filenames[j];
                let actualString = fs.readFileSync('emulated_data/' + actual).toString();
                let actualExperiment = JSON.parse(actualString);
                if (actualExperiment.topology.caption == predictedTopology.caption) { // we can use caption as identifier here (see EmulatedDataGenerator to see how it's generated)
                    confusionMatrix[actualPureNodeIndex][j]++;
                }
            }
        });
    }
    appendRandomNodesToPureNode(pureNode, nodesToAppend) {
        if (nodesToAppend == 0) {
            return;
        }
        for (let childNode of pureNode.peers) {
            if (this.generateRandomNr(0, 4) == 0) {
                let pureNodeType = this.generateRandomNodeType();
                let pureNode = {
                    peers: [],
                    nodeType: pureNodeType,
                    name: types_1.NodeType[pureNodeType] + '-' + this.makeid(5)
                };
                childNode.peers.push(pureNode);
                this.appendRandomNodesToPureNode(childNode, nodesToAppend - 1);
            }
            else {
                this.appendRandomNodesToPureNode(childNode, nodesToAppend);
            }
        }
    }
    cutTreeFromLevel(level, pureNode) {
        if (level == 0) {
            pureNode.peers = [];
        }
        for (let peer of pureNode.peers) {
            this.cutTreeFromLevel(level - 1, peer);
        }
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
    generateRandomNodeType() {
        let random = this.normalRandomInteger(2, 1);
        if (random == 2) {
            return types_1.NodeType.vehicle;
        }
        else if (random == 3) {
            return types_1.NodeType.edge;
        }
        else if (random == 1 || random == 4) {
            return types_1.NodeType.rsu;
        }
        else {
            return types_1.NodeType.cloud;
        }
    }
    normalRandomInteger(mu, sigma) {
        let randomFcn = random.normal(mu, sigma);
        let randNr = randomFcn();
        if (randNr < 1) {
            return 1;
        }
        return Math.floor(randNr);
    }
    generateRandomNr(min, max) {
        if (min == max) {
            return min;
        }
        /**
         * FROM: https://stackoverflow.com/a/1527820/2205582
         * Returns a random integer between min (inclusive) and max (inclusive).
         * The value is no lower than min (or the next integer greater than min
         * if min isn't an integer) and no greater than max (or the next integer
         * lower than max if max isn't an integer).
         * Using Math.round() will give you a non-uniform distribution!
         */
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
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