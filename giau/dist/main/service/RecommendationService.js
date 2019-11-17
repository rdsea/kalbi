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
class RecommendationService {
    constructor(deploymentPatternMatcher, experimentService, logger) {
        this.deploymentPatternMatcher = deploymentPatternMatcher;
        this.experimentService = experimentService;
        this.logger = logger;
        this.toscaTopologyAdapter = new TOSCATopologyAdapter_1.TOSCATopologyAdapter(this.logger);
    }
    bestBenchmarkForDeploymentPattern(deploymentPatternId, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.experimentService.readBestExperimentByEvaluationMetric(deploymentPatternId, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes);
        });
    }
    recommendTopology(node, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes, returnBenchmark) {
        return __awaiter(this, void 0, void 0, function* () {
            DeploymentPatternValidation_1.DeploymentPatternValidation.validatePureNode(node);
            this.logger.info('Recommending a topology');
            let mostSimilarDeploymentPattern = yield this.deploymentPatternMatcher.findSimilarDeploymentPattern(node);
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
                if (returnBenchmark) {
                    return bestExperiment;
                }
                else {
                    return bestExperiment.topology;
                }
            }
        });
    }
    recommendTopologyTOSCA(toscaTopologyDefinitionInYAMLString, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes) {
        return __awaiter(this, void 0, void 0, function* () {
            let toscaTopologyDefinitionInJSON = yaml.safeLoad(toscaTopologyDefinitionInYAMLString);
            let structure = this.toscaTopologyAdapter.translateTOSCAToPureNodeStructure(toscaTopologyDefinitionInJSON);
            let bestTopology = yield this.recommendTopology(structure, syncStatePriority, acceptedTxRatePriority, medianAcceptanceTxTimePriority, infrastructureRes, false);
            if (bestTopology) {
                toscaTopologyDefinitionInJSON = this.toscaTopologyAdapter.translateTopologyToTOSCA(bestTopology);
                return yaml.safeDump(toscaTopologyDefinitionInJSON);
            }
            else {
                return yaml.safeDump(toscaTopologyDefinitionInJSON);
            }
        });
    }
}
exports.RecommendationService = RecommendationService;
//# sourceMappingURL=RecommendationService.js.map