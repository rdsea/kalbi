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
const TOSCATopologyAdapter_1 = require("./TOSCATopologyAdapter");
const yaml = require("js-yaml");
const DeploymentPatternValidation_1 = require("../validation/DeploymentPatternValidation");
class NodeTypePair {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }
    equals(that) {
        return (this.a == that.a && this.b == that.b) || (this.b == that.a && this.a == that.b);
    }
}
class RecommendationService {
    constructor(depPatternService, experimentService, logger) {
        this.depPatternService = depPatternService;
        this.experimentService = experimentService;
        this.logger = logger;
        this.toscaTopologyAdapter = new TOSCATopologyAdapter_1.TOSCATopologyAdapter(this.logger);
    }
    findMostSimilarDeploymentPattern(node) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Looking for most similar deployment pattern to ' + JSON.stringify(node, null, 4));
            if (!node) {
                return null;
            }
            let depPattern = yield this.depPatternService.readAll();
            let matchedDepPattern = this.findSimilarDeploymentPattern(depPattern, node);
            if (matchedDepPattern) {
                this.logger.info(`Find matched pattern id = ${matchedDepPattern._id}`);
            }
            else {
                this.logger.info('No similar deployment pattern has been found');
            }
            return matchedDepPattern;
        });
    }
    bestBenchmarkForDeploymentPattern(deploymentPatternId, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.experimentService.readBestExperimentByEvaluationMetric(deploymentPatternId, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);
        });
    }
    recommendTopology(node, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes) {
        return __awaiter(this, void 0, void 0, function* () {
            DeploymentPatternValidation_1.DeploymentPatternValidation.validatePureNode(node);
            this.logger.info('Recommending a topology');
            let mostSimilarDeploymentPattern = yield this.findMostSimilarDeploymentPattern(node);
            if (!mostSimilarDeploymentPattern) {
                this.logger.info('A Topology cannot be recommended');
                return null;
            }
            let bestExperiment = yield this.bestBenchmarkForDeploymentPattern(mostSimilarDeploymentPattern._id, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);
            if (!bestExperiment) {
                this.logger.info(`No Experiment for deployment pattern ${mostSimilarDeploymentPattern._id} has been found. Topology cannot be recommended`);
                return null;
            }
            else {
                return bestExperiment.topology;
            }
        });
    }
    recommendTopologyTOSCA(toscaTopologyDefinitionInYAMLString, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes) {
        return __awaiter(this, void 0, void 0, function* () {
            let toscaTopologyDefinitionInJSON = yaml.safeLoad(toscaTopologyDefinitionInYAMLString);
            let structure = this.toscaTopologyAdapter.translateTOSCAToPureNodeStructure(toscaTopologyDefinitionInJSON);
            let bestTopology = yield this.recommendTopology(structure, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);
            if (bestTopology) {
                toscaTopologyDefinitionInJSON = this.toscaTopologyAdapter.applyTopologyPropertiesToTOSCA(bestTopology, toscaTopologyDefinitionInJSON);
                return yaml.safeDump(toscaTopologyDefinitionInJSON);
            }
            else {
                return yaml.safeDump(toscaTopologyDefinitionInJSON);
            }
        });
    }
    findSimilarDeploymentPattern(depPatternsStructure, newStructure) {
        let newStructureInteractPairs = this.splitToInteractionPairs(newStructure);
        if (newStructureInteractPairs.length == 0) {
            // there is no interaction, matching only nodetypes
            for (let depPattern of depPatternsStructure) {
                if (depPattern.structure.nodeType == newStructure.nodeType) {
                    return depPattern;
                }
            }
        }
        else {
            let maxMatchesCount = 0;
            let matchPortion = 0;
            let bestPattern = null;
            for (let depPattern of depPatternsStructure) {
                let matchesCount = 0;
                let structureInteractionPairs = this.splitToInteractionPairs(depPattern.structure);
                matchesCount = this.countMatchedInteractionPairs(newStructureInteractPairs, structureInteractionPairs);
                if (maxMatchesCount < matchesCount) {
                    maxMatchesCount = matchesCount;
                    bestPattern = depPattern;
                    matchPortion = newStructureInteractPairs.length / structureInteractionPairs.length;
                }
                else if (maxMatchesCount == matchesCount) {
                    if (newStructureInteractPairs.length / structureInteractionPairs.length > matchPortion) {
                        matchPortion = newStructureInteractPairs.length / structureInteractionPairs.length;
                        bestPattern = depPattern;
                    }
                }
            }
            return bestPattern;
        }
        return null;
    }
    splitToInteractionPairs(pureNode) {
        let pairs = [];
        for (let peer of pureNode.peers) {
            let pair = new NodeTypePair(pureNode.nodeType, peer.nodeType);
            if (!peer.peers || peer.peers.length == 0) {
                pairs.push(pair);
            }
            else {
                pairs = pairs.concat(this.splitToInteractionPairs(peer));
                pairs.push(pair);
            }
        }
        return pairs;
    }
    countMatchedInteractionPairs(a, b) {
        let usedPair = {};
        let matchesCount = 0;
        for (let inputPair of a) {
            let i = 0;
            for (let structurePair of b) {
                if (structurePair.equals(inputPair) && !usedPair[i]) {
                    usedPair[i] = true;
                    matchesCount++;
                    break;
                }
                i++;
            }
        }
        return matchesCount;
    }
}
exports.RecommendationService = RecommendationService;
