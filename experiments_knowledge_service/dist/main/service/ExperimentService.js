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
const mongodb_1 = require("mongodb");
const ServiceException_1 = require("./ServiceException");
const PersistenceException_1 = require("../repository/PersistenceException");
const ExperimentValidation_1 = require("../validation/ExperimentValidation");
class ExperimentService {
    constructor(repository, topologyService, expResultService, depPatternService, logger) {
        this.repository = repository;
        this.topologyService = topologyService;
        this.expResultService = expResultService;
        this.depPatternService = depPatternService;
        this.logger = logger;
    }
    /**
     * TODO - improve architecture, validator should be a dependency of of each service, a validation should happen in a general abstract method.
     *
     */
    create(experiment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                ExperimentValidation_1.ExperimentValidation.validate(experiment);
                this.logger.debug(`Creating new Experiment`);
                this.logger.debug(`Experiment = ${JSON.stringify(experiment, null, 4)}`);
                let topology = yield this.topologyService.create(experiment.topology);
                experiment.topology = topology;
                let resultId = null;
                if (experiment.benchmark) {
                    let expResult = yield this.expResultService.create(experiment.benchmark);
                    experiment.benchmark = expResult;
                    resultId = new mongodb_1.ObjectId(experiment.benchmark._id);
                }
                let depPattern = yield this.depPatternService.createFromExperiment(experiment);
                experiment.depPattern = depPattern;
                let expDataModel = {
                    _id: null,
                    topology_id: new mongodb_1.ObjectId(topology._id),
                    benchmark_id: resultId,
                    deployment_pattern_id: depPattern._id
                };
                expDataModel = yield this.repository.create(expDataModel);
                experiment._id = expDataModel._id.toHexString();
                this.logger.info(`Created Experiment with id = ${experiment._id}`);
                return experiment;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('Experiment hasnt been created');
                }
                else {
                    throw e;
                }
            }
        });
    }
    readOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let experimentDataModel = yield this.repository.readOneById(id);
                if (!experimentDataModel) {
                    return null;
                }
                let topology = yield this.topologyService.readOne(experimentDataModel.topology_id.toHexString());
                if (!topology) {
                    this.logger.warn(`Topology related to Experiment with ${id} not found, removing Experiment`);
                    yield this.delete(id);
                    return null;
                }
                let expResult = null;
                if (experimentDataModel.benchmark_id) {
                    expResult = yield this.expResultService.readOne(experimentDataModel.benchmark_id.toHexString());
                }
                let depPattern = yield this.depPatternService.readOne(experimentDataModel.deployment_pattern_id);
                if (!depPattern) {
                    this.logger.warn(`DeploymentPattern related to Experiment with ${id} not found, removing Experiment`);
                    yield this.delete(id);
                    return null;
                }
                let experiment = {
                    topology: topology,
                    benchmark: expResult,
                    _id: experimentDataModel._id.toHexString(),
                    depPattern: depPattern
                };
                return experiment;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    return null;
                }
                else {
                    throw e;
                }
            }
        });
    }
    readAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let experimentDataModels = yield this.repository.readAll();
                if (!experimentDataModels) {
                    return [];
                }
                let experiments = [];
                for (let experimentDM of experimentDataModels) {
                    let experiment = yield this.readOne(experimentDM._id.toHexString());
                    if (experiment) {
                        experiments.push(experiment);
                    }
                }
                return experiments;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    return [];
                }
                else {
                    throw e;
                }
            }
        });
    }
    readBestExperimentByEvaluationMetric(deploymentPatternId, syncStatePriority, acceptedTxRatePriority, medianTxAcceptanceTimePriority, infrastructureRes) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info(`Looking for the Experiment, which achieved best Benchmarks, related to pattern: ${deploymentPatternId}`);
                let qualityAttributesPriorities = [
                    {
                        name: 'syncStatePriority',
                        priority: syncStatePriority
                    },
                    {
                        name: 'acceptedTxRatePriority',
                        priority: acceptedTxRatePriority
                    },
                    {
                        name: 'medianTxAcceptanceTimePriority',
                        priority: medianTxAcceptanceTimePriority
                    },
                    {
                        name: 'infrastructureRes',
                        priority: infrastructureRes
                    }
                ];
                qualityAttributesPriorities = qualityAttributesPriorities.sort((n1, n2) => n2.priority - n1.priority);
                this.logger.info(`Sorted quality attributes by priorities: ${JSON.stringify(qualityAttributesPriorities, null, 4)}`);
                let bestMetricValues = [];
                for (let qualityAttribute of qualityAttributesPriorities) {
                    if (qualityAttribute.priority < 0) {
                        continue;
                    }
                    let attributeName = qualityAttribute.name;
                    this.logger.info(`=== Retrieving best experiments for attribute: ${attributeName} ===`);
                    bestMetricValues = yield this.obtainMetrics(deploymentPatternId, bestMetricValues, attributeName);
                    if (bestMetricValues && bestMetricValues.length == 1) {
                        this.logger.info(`Found experiment: ${bestMetricValues[0].experimentId}`);
                        return yield this.readOne(bestMetricValues[0].experimentId);
                    }
                }
                if (bestMetricValues.length == 0) {
                    return null;
                }
                return yield this.readOne(bestMetricValues[0].experimentId);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException || e instanceof ServiceException_1.ServiceException) {
                    return null;
                }
                else {
                    throw e;
                }
            }
        });
    }
    obtainMetrics(deploymentPatternId, bestMetricValues, qualityAttributeName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (bestMetricValues.length == 0) {
                let metricValueSorted = yield this.findDepPattern(deploymentPatternId, qualityAttributeName);
                this.logger.info(`Found ${metricValueSorted.length} experiments for deployment pattern ${deploymentPatternId}`);
                let i = 0;
                while (i < metricValueSorted.length && metricValueSorted[i].metricValue == metricValueSorted[0].metricValue) {
                    bestMetricValues.push(metricValueSorted[i]);
                    i++;
                }
                this.logger.info(`Shorten array from ${metricValueSorted.length} to ${bestMetricValues.length}`);
            }
            else if (bestMetricValues.length > 1) {
                let metricValueSorted = yield this.findExperiments(bestMetricValues.map((value) => value.experimentId), qualityAttributeName);
                this.logger.info(`Found ${metricValueSorted.length} experiments`);
                bestMetricValues = [];
                let i = 0;
                while (i < metricValueSorted.length && metricValueSorted[i].metricValue == metricValueSorted[0].metricValue) {
                    bestMetricValues.push(metricValueSorted[i]);
                    i++;
                }
                this.logger.info(`Shorten array from ${metricValueSorted.length} to ${bestMetricValues.length}`);
            }
            return bestMetricValues;
        });
    }
    findDepPattern(deploymentPattern, attributeName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (attributeName === 'syncStatePriority') {
                return yield this.repository.findAllForDeploymentPatternSortByNotSyncNodesCount(deploymentPattern);
            }
            else if (attributeName == 'acceptedTxRatePriority') {
                return yield this.repository.findAllForDeploymentPatternSortByAcceptedTxCount(deploymentPattern);
            }
            else if (attributeName == 'medianTxAcceptanceTimePriority') {
                return yield this.repository.findAllForDeploymentPatternSortByMedianAcceptanceTime(deploymentPattern);
            }
            else if (attributeName == 'infrastructureRes') {
                return yield this.repository.findAllForDeploymentPatternSortByInfResUtil(deploymentPattern);
            }
        });
    }
    findExperiments(experimentsIds, attributeName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (attributeName === 'syncStatePriority') {
                return yield this.repository.findAllForExperimentsSortByNotSyncNodesCount(experimentsIds);
            }
            else if (attributeName == 'acceptedTxRatePriority') {
                return yield this.repository.findAllForExperimentsSortByAcceptedTxCount(experimentsIds);
            }
            else if (attributeName == 'medianTxAcceptanceTimePriority') {
                return yield this.repository.findAllForExperimentsSortByMedianAcceptanceTime(experimentsIds);
            }
            else if (attributeName == 'infrastructureRes') {
                return yield this.repository.findAllForExperimentsSortByInfResUtil(experimentsIds);
            }
        });
    }
    readAllByDeploymentPatternId() {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Removing Experiment with ID = ' + id);
            let experimentDataModel = null;
            try {
                experimentDataModel = yield this.repository.readOneById(id);
            }
            catch (e) {
            }
            if (!experimentDataModel) {
                this.logger.debug(`No Experiment with ID = ${id} found, nothing to remove`);
                return;
            }
            try {
                yield this.topologyService.delete(experimentDataModel.topology_id.toHexString());
            }
            catch (e) {
            }
            try {
                if (experimentDataModel.benchmark_id) {
                    yield this.expResultService.delete(experimentDataModel.benchmark_id.toHexString());
                }
            }
            catch (e) {
            }
            try {
                yield this.repository.delete(id);
                this.logger.info(`Removed Experiment with id = ${id}`);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('Experiment hasnt been removed');
                }
                else {
                    throw e;
                }
            }
        });
    }
}
exports.ExperimentService = ExperimentService;
