import {IDeploymentPatternService} from "./interfaces";
import {Logger} from "log4js";
import {DeploymentPattern, ResourceType, DPNode} from "../model/dtos";


class ResourceTypePair {

    constructor(public a: ResourceType, public b: ResourceType) {

    }

    equals(that: ResourceTypePair): boolean {
        return (this.a == that.a && this.b == that.b) || (this.b == that.a && this.a == that.b);
    }

}

export class DeploymentPatternMatcher {

    constructor(private depPatternService: IDeploymentPatternService,
                private logger: Logger) {

    }

    public async findSimilarDeploymentPattern(newStructure: DPNode): Promise<DeploymentPattern> {

        let matchedDepPattern: DeploymentPattern = null;

        this.logger.info('Looking for most similar deployment pattern to ' + JSON.stringify(newStructure, null, 4));

        let depPatternsStructure: DeploymentPattern[] = await this.depPatternService.readAll();

        let newStructureInteractPairs: ResourceTypePair[] = this.splitToInteractionPairs(newStructure);

        if (newStructureInteractPairs.length == 0) {
            // there is no interaction, matching only resource types
            for (let depPattern of depPatternsStructure) {
                if (depPattern.structure.resourceType == newStructure.resourceType) {
                    matchedDepPattern = depPattern;
                }
            }
        } else {
            let maxMatchesCount: number = 0;
            let matchPortion: number = 0;
            let bestPattern: DeploymentPattern = null;

            for (let depPattern of depPatternsStructure) {

                let matchesCount: number = 0;
                let structureInteractionPairs: ResourceTypePair[] = this.splitToInteractionPairs(depPattern.structure);

                matchesCount = this.countMatchedInteractionPairs(newStructureInteractPairs, structureInteractionPairs);


                if (maxMatchesCount < matchesCount) {
                    maxMatchesCount = matchesCount;
                    bestPattern = depPattern;
                    matchPortion = newStructureInteractPairs.length / structureInteractionPairs.length;
                } else if (maxMatchesCount == matchesCount) {
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
        } else {
            this.logger.info('No similar deployment pattern has been found');
        }
        return matchedDepPattern;
    }

    private splitToInteractionPairs(pureNode: DPNode): ResourceTypePair[] {
        let pairs: ResourceTypePair[] = [];
        for (let peer of pureNode.peers) {
            let pair: ResourceTypePair = new ResourceTypePair(pureNode.resourceType, peer.resourceType);
            if (!peer.peers || peer.peers.length == 0) {
                pairs.push(pair);
            } else {
                pairs = pairs.concat(this.splitToInteractionPairs(peer));
                pairs.push(pair);
            }
        }
        return pairs;
    }

    private countMatchedInteractionPairs(a: ResourceTypePair[], b: ResourceTypePair[]): number { // b - a

        let usedPair = {};
        let matchesCount: number = 0;

        for (let inputPair of a) {
            let i: number = 0;
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