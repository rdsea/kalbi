import {DeploymentPattern, Experiment, DPNode, Topology} from "../model/dtos";
import {IExperimentService, IRecommendationService} from "./interfaces";
import {Logger} from "log4js";
import {TOSCATopologyAdapter} from "./TOSCATopologyAdapter";
import * as yaml from 'js-yaml'
import {DeploymentPatternValidation} from "../validation/DeploymentPatternValidation";
import {DeploymentPatternMatcher} from "./DeploymentPatternMatcher";


export class RecommendationService implements IRecommendationService {


    private toscaTopologyAdapter: TOSCATopologyAdapter;

    constructor(private deploymentPatternMatcher: DeploymentPatternMatcher,
                private experimentService: IExperimentService,
                private logger: Logger) {

        this.toscaTopologyAdapter = new TOSCATopologyAdapter(this.logger);

    }

    async bestBenchmarkForDeploymentPattern(deploymentPatternId: string, syncStatePriority: number, acceptedTxRatePriority: number, medianAcceptanceTxTimePriority: number, infrastructureRes: number): Promise<Experiment> {
        return await this.experimentService.readBestExperimentByEvaluationMetric(deploymentPatternId, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);
    }

    async recommendTopology(node: DPNode, syncStatePriority: number, acceptedTxRatePriority: number, medianAcceptanceTxTimePriority: number, infrastructureRes: number, returnBenchmark: boolean): Promise<any> {

        DeploymentPatternValidation.validatePureNode(node);

        this.logger.info('Recommending a topology');
        let mostSimilarDeploymentPattern: DeploymentPattern = await this.deploymentPatternMatcher.findSimilarDeploymentPattern(node);

        if (!mostSimilarDeploymentPattern) {
            this.logger.info('A Topology cannot be recommended');
            return null;
        }

        let bestExperiment: Experiment = await this.bestBenchmarkForDeploymentPattern(mostSimilarDeploymentPattern._id, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);

        if (!bestExperiment) {
            this.logger.info(`No Experiment for deployment pattern ${mostSimilarDeploymentPattern._id} has been found. Topology cannot be recommended`);
            return null;
        } else {
            if (returnBenchmark) {
                return bestExperiment;
            } else {
                return bestExperiment.topology;
            }
        }
    }

    async recommendTopologyTOSCA(toscaTopologyDefinitionInYAMLString: string, syncStatePriority: number, acceptedTxRatePriority: number, medianAcceptanceTxTimePriority: number, infrastructureRes: number): Promise<any> {

        let toscaTopologyDefinitionInJSON = yaml.safeLoad(toscaTopologyDefinitionInYAMLString);
        let structure: DPNode = this.toscaTopologyAdapter.translateTOSCAToPureNodeStructure(toscaTopologyDefinitionInJSON);
        let bestTopology: Topology = await this.recommendTopology(structure, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes, false);

        if (bestTopology) {
            toscaTopologyDefinitionInJSON = this.toscaTopologyAdapter.translateTopologyToTOSCA(bestTopology);
            return yaml.safeDump(toscaTopologyDefinitionInJSON);
        } else {
            return yaml.safeDump(toscaTopologyDefinitionInJSON);
        }
    }

}