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
class RecommendationEndpoint {
    constructor(recommendationService, logger) {
        this.recommendationService = recommendationService;
        this.logger = logger;
    }
    routes(app) {
        app.route('/findMostSimilarDeploymentPattern')
            .post((req, res) => __awaiter(this, void 0, void 0, function* () {
            let pureNode = req.body;
            let depPattern = yield this.recommendationService.findMostSimilarDeploymentPattern(pureNode);
            res.status(200).send(depPattern);
        }));
        app.route('/bestBenchmarkForDeploymentPattern/:id')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            let depPatternId = req.params.id;
            let syncPriority = req.query.syncPrior ? req.query.syncPrior : -1;
            let txAcceptRate = req.query.txAcceptRate ? req.query.txAcceptRate : -1;
            let txAcceptTime = req.query.txAcceptTime ? req.query.txAcceptTime : -1;
            let infrastructureResourceUtil = req.query.infRes ? req.query.infRes : -1;
            let exp = yield this.recommendationService.bestBenchmarkForDeploymentPattern(depPatternId, syncPriority, txAcceptRate, txAcceptTime, infrastructureResourceUtil);
            res.status(200).send(exp);
        }));
        app.route('/recommendTopology')
            .post((req, res) => __awaiter(this, void 0, void 0, function* () {
            let syncPriority = req.query.syncPrior ? req.query.syncPrior : -1;
            let txAcceptRate = req.query.txAcceptRate ? req.query.txAcceptRate : -1;
            let txAcceptTime = req.query.txAcceptTime ? req.query.txAcceptTime : -1;
            let infrastructureResourceUtil = req.query.infRes ? req.query.infRes : -1;
            let pureNode = req.body;
            let topology = yield this.recommendationService.recommendTopology(pureNode, syncPriority, txAcceptRate, txAcceptTime, infrastructureResourceUtil);
            res.status(200).send(topology);
        }));
        app.route('/recommendTopologyTOSCA')
            .post((req, res) => __awaiter(this, void 0, void 0, function* () {
            let syncPriority = req.query.syncPrior ? req.query.syncPrior : -1;
            let txAcceptRate = req.query.txAcceptRate ? req.query.txAcceptRate : -1;
            let txAcceptTime = req.query.txAcceptTime ? req.query.txAcceptTime : -1;
            let infrastructureResourceUtil = req.query.infRes ? req.query.infRes : -1;
            let toscaTopologyDefinition = req.body;
            let recommendedTopologyInTOSCA = yield this.recommendationService.
                recommendTopologyTOSCA(toscaTopologyDefinition, syncPriority, txAcceptRate, txAcceptTime, infrastructureResourceUtil);
            res.status(200).send(recommendedTopologyInTOSCA);
        }));
    }
}
exports.RecommendationEndpoint = RecommendationEndpoint;
