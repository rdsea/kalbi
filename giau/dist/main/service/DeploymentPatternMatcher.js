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
class ResourceTypePair {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }
    equals(that) {
        return (this.a == that.a && this.b == that.b) || (this.b == that.a && this.a == that.b);
    }
}
class DeploymentPatternMatcher {
    constructor(depPatternService, logger) {
        this.depPatternService = depPatternService;
        this.logger = logger;
    }
    findSimilarDeploymentPattern(newStructure) {
        return __awaiter(this, void 0, void 0, function* () {
            let matchedDepPattern = null;
            this.logger.info('Looking for most similar deployment pattern to ' + JSON.stringify(newStructure, null, 4));
            let depPatternsStructure = yield this.depPatternService.readAll();
            let newStructureInteractPairs = this.splitToInteractionPairs(newStructure);
            if (newStructureInteractPairs.length == 0) {
                // there is no interaction, matching only resource types
                for (let depPattern of depPatternsStructure) {
                    if (depPattern.structure.resourceType == newStructure.resourceType) {
                        matchedDepPattern = depPattern;
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
                matchedDepPattern = bestPattern;
            }
            if (matchedDepPattern) {
                this.logger.info(`Find matched pattern id = ${matchedDepPattern._id}`);
            }
            else {
                this.logger.info('No similar deployment pattern has been found');
            }
            return matchedDepPattern;
        });
    }
    splitToInteractionPairs(pureNode) {
        let pairs = [];
        for (let peer of pureNode.peers) {
            let pair = new ResourceTypePair(pureNode.resourceType, peer.resourceType);
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
exports.DeploymentPatternMatcher = DeploymentPatternMatcher;
//# sourceMappingURL=DeploymentPatternMatcher.js.map