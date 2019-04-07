import {DeploymentPattern, Experiment, NodeType, PureNode, Topology} from "../model/dtos";
import {IDeploymentPatternService, IExperimentService, IRecommendationService} from "./interfaces";
import {Logger} from "log4js";
import {TOSCATopologyAdapter} from "./TOSCATopologyAdapter";
import * as yaml from 'js-yaml'
import {DeploymentPatternValidation} from "../validation/DeploymentPatternValidation";


class NodeTypePair {

    constructor(public a: NodeType, public b: NodeType) {

    }

    equals(that: NodeTypePair): boolean {
        return (this.a == that.a && this.b == that.b) || (this.b == that.a && this.a == that.b);
    }

}

export class RecommendationService implements IRecommendationService {


    private toscaTopologyAdapter: TOSCATopologyAdapter;

    constructor(private depPatternService: IDeploymentPatternService,
                private experimentService: IExperimentService,
                private logger: Logger) {

        this.toscaTopologyAdapter = new TOSCATopologyAdapter(this.logger);

    }

    async findMostSimilarDeploymentPattern(node: PureNode): Promise<DeploymentPattern> {

        this.logger.info('Looking for most similar deployment pattern to ' + JSON.stringify(node, null, 4));

        if (!node) {
            return null;
        }
        let depPattern: DeploymentPattern[] = await this.depPatternService.readAll();
        let matchedDepPattern: DeploymentPattern = this.findSimilarDeploymentPattern(depPattern, node);
        if (matchedDepPattern) {
            this.logger.info(`Find matched pattern id = ${matchedDepPattern._id}`);
        } else {
            this.logger.info('No similar deployment pattern has been found');
        }
        return matchedDepPattern;
    }

    async bestBenchmarkForDeploymentPattern(deploymentPatternId: string, syncStatePriority: number, acceptedTxRatePriority: number, medianAcceptanceTxTimePriority: number, infrastructureRes: number): Promise<Experiment> {
        return await this.experimentService.readBestExperimentByEvaluationMetric(deploymentPatternId, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);
    }

    async recommendTopology(node: PureNode, syncStatePriority: number, acceptedTxRatePriority: number, medianAcceptanceTxTimePriority: number, infrastructureRes: number): Promise<Topology> {

        DeploymentPatternValidation.validatePureNode(node);

        this.logger.info('Recommending a topology');
        let mostSimilarDeploymentPattern: DeploymentPattern = await this.findMostSimilarDeploymentPattern(node);

        if (!mostSimilarDeploymentPattern) {
            this.logger.info('A Topology cannot be recommended');
            return null;
        }

        let bestExperiment: Experiment = await this.bestBenchmarkForDeploymentPattern(mostSimilarDeploymentPattern._id, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);

        if (!bestExperiment) {
            this.logger.info(`No Experiment for deployment pattern ${mostSimilarDeploymentPattern._id} has been found. Topology cannot be recommended`);
            return null;
        } else {
            return bestExperiment.topology;
        }
    }

    async recommendTopologyTOSCA(toscaTopologyDefinitionInYAMLString: string, syncStatePriority: number, acceptedTxRatePriority: number, medianAcceptanceTxTimePriority: number, infrastructureRes: number): Promise<any> {

        let toscaTopologyDefinitionInJSON = yaml.safeLoad(toscaTopologyDefinitionInYAMLString);
        let structure: PureNode = this.toscaTopologyAdapter.translateTOSCAToPureNodeStructure(toscaTopologyDefinitionInJSON);
        let bestTopology: Topology = await this.recommendTopology(structure, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);

        if (bestTopology) {
            toscaTopologyDefinitionInJSON = this.toscaTopologyAdapter.applyTopologyPropertiesToTOSCA(bestTopology, toscaTopologyDefinitionInJSON);
            return yaml.safeDump(toscaTopologyDefinitionInJSON);
        } else {
            return yaml.safeDump(toscaTopologyDefinitionInJSON);
        }
    }


    private findSimilarDeploymentPattern(depPatternsStructure: DeploymentPattern[], newStructure: PureNode): DeploymentPattern {

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