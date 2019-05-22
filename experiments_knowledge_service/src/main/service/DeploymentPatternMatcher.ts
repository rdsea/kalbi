import {IDeploymentPatternService} from "./interfaces";
import {Logger} from "log4js";
import {DeploymentPattern, NodeType, PureNode} from "../model/dtos";


class NodeTypePair {

    constructor(public a: NodeType, public b: NodeType) {

    }

    equals(that: NodeTypePair): boolean {
        return (this.a == that.a && this.b == that.b) || (this.b == that.a && this.a == that.b);
    }

}

export class DeploymentPatternMatcher {

    constructor(private depPatternService: IDeploymentPatternService,
                private logger: Logger) {

    }

    public async findSimilarDeploymentPattern(newStructure: PureNode): Promise<DeploymentPattern> {

        let depPatternsStructure: DeploymentPattern[] = await this.depPatternService.readAll();

        let newStructureInteractPairs: NodeTypePair[] = this.splitToInteractionPairs(newStructure);

        if (newStructureInteractPairs.length == 0) {
            // there is no interaction, matching only nodetypes
            for (let depPattern of depPatternsStructure) {
                if (depPattern.structure.nodeType == newStructure.nodeType) {
                    return depPattern;
                }
            }
        } else {
            let maxMatchesCount: number = 0;
            let matchPortion: number = 0;
            let bestPattern: DeploymentPattern = null;

            for (let depPattern of depPatternsStructure) {

                let matchesCount: number = 0;
                let structureInteractionPairs: NodeTypePair[] = this.splitToInteractionPairs(depPattern.structure);

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
            return bestPattern;
        }
        return null;
    }

    private splitToInteractionPairs(pureNode: PureNode): NodeTypePair[] {
        let pairs: NodeTypePair[] = [];
        for (let peer of pureNode.peers) {
            let pair: NodeTypePair = new NodeTypePair(pureNode.nodeType, peer.nodeType);
            if (!peer.peers || peer.peers.length == 0) {
                pairs.push(pair);
            } else {
                pairs = pairs.concat(this.splitToInteractionPairs(peer));
                pairs.push(pair);
            }
        }
        return pairs;
    }

    private countMatchedInteractionPairs(a: NodeTypePair[], b: NodeTypePair[]): number { // b - a

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