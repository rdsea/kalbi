import {IDeploymentPatternService, IBenchmarkService, IExperimentService, ITopologyService} from "./interfaces";
import {DeploymentPattern, Experiment, Benchmark, Topology} from "../model/dtos";
import {IExperimentRepository} from "../repository/interfaces";
import {Logger} from "log4js";
import {ExperimentDataModel} from "../model/data_models";
import {ObjectId} from "mongodb";
import {MetricWrapper} from "../repository/ExperimentRepository";
import {ServiceException} from "./ServiceException";
import {PersistenceException} from "../repository/PersistenceException";
import {ExperimentValidation} from "../validation/ExperimentValidation";


export class ExperimentService implements IExperimentService {

    constructor(private repository: IExperimentRepository,
                private topologyService: ITopologyService,
                private expResultService: IBenchmarkService,
                private depPatternService: IDeploymentPatternService,
                private logger: Logger) {

    }

    /**
     * TODO - improve architecture, validator should be a dependency of of each service, a validation should happen in a general abstract method.
     *
     */

    async create(experiment: Experiment): Promise<Experiment> {

        try {
            ExperimentValidation.validate(experiment);

            this.logger.debug(`Creating new Experiment`);
            this.logger.debug(`Experiment = ${JSON.stringify(experiment, null, 4)}`);

            let topology: Topology = await this.topologyService.create(experiment.topology);
            experiment.topology = topology;

            let resultId: ObjectId = null;
            if (experiment.benchmark) {
                let expResult: Benchmark = await this.expResultService.create(experiment.benchmark);
                experiment.benchmark = expResult;
                resultId = new ObjectId(experiment.benchmark._id);
            }

            let depPattern: DeploymentPattern = await this.depPatternService.createFromExperiment(experiment);
            experiment.depPattern = depPattern;

            let expDataModel: ExperimentDataModel = {
                _id: null,
                topology_id: new ObjectId(topology._id),
                benchmark_id: resultId,
                deployment_pattern_id: depPattern._id
            };

            expDataModel = await this.repository.create(expDataModel);
            experiment._id = expDataModel._id.toHexString();

            this.logger.info(`Created Experiment with id = ${experiment._id}`);

            return experiment;
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('Experiment hasnt been created');
            } else {
                throw e;
            }
        }
    }

    async readOne(id: string): Promise<Experiment> {

        try {
            let experimentDataModel: ExperimentDataModel = await this.repository.readOneById(id);

            if (!experimentDataModel) {
                return null;
            }

            let topology: Topology = await this.topologyService.readOne(experimentDataModel.topology_id.toHexString());
            if (!topology) {
                this.logger.warn(`Topology related to Experiment with ${id} not found, removing Experiment`);
                await this.delete(id);
                return null;
            }

            let expResult: Benchmark = null;
            if (experimentDataModel.benchmark_id) {
                expResult = await this.expResultService.readOne(experimentDataModel.benchmark_id.toHexString());
            }

            let depPattern: DeploymentPattern = await this.depPatternService.readOne(experimentDataModel.deployment_pattern_id);

            if (!depPattern) {
                this.logger.warn(`DeploymentPattern related to Experiment with ${id} not found, removing Experiment`);
                await this.delete(id);
                return null;
            }

            let experiment: Experiment = {
                topology: topology,
                benchmark: expResult,
                _id: experimentDataModel._id.toHexString(),
                depPattern: depPattern
            };

            return experiment;
        } catch (e) {
            if (e instanceof PersistenceException) {
                return null;
            } else {
                throw e;
            }
        }

    }

    async readAll(): Promise<Experiment[]> {

        try {
            let experimentDataModels: ExperimentDataModel[] = await this.repository.readAll();

            if (!experimentDataModels) {
                return [];
            }

            let experiments: Experiment[] = [];

            for (let experimentDM of experimentDataModels) {
                let experiment: Experiment = await this.readOne(experimentDM._id.toHexString());
                if (experiment) {
                    experiments.push(experiment);
                }
            }

            return experiments;
        } catch (e) {
            if (e instanceof PersistenceException) {
                return [];
            } else {
                throw e;
            }
        }

    }

    async readBestExperimentByEvaluationMetric(deploymentPatternId: string, syncStatePriority: number, acceptedTxRatePriority: number, medianTxAcceptanceTimePriority: number, infrastructureRes: number): Promise<Experiment> {

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
            let bestMetricValues: MetricWrapper[] = [];

            for (let qualityAttribute of qualityAttributesPriorities) {
                if (qualityAttribute.priority < 0) {
                    continue;
                }
                let attributeName: string = qualityAttribute.name;
                this.logger.info(`=== Retrieving best experiments for attribute: ${attributeName} ===`);
                bestMetricValues = await this.obtainMetrics(deploymentPatternId, bestMetricValues, attributeName);
                if (bestMetricValues && bestMetricValues.length == 1) {
                    this.logger.info(`Found experiment: ${bestMetricValues[0].experimentId}`);
                    return await this.readOne(bestMetricValues[0].experimentId);
                }
            }
            if (bestMetricValues.length == 0) {
                return null;
            }
            return await this.readOne(bestMetricValues[0].experimentId);
        } catch (e) {
            if (e instanceof PersistenceException || e instanceof ServiceException) {
                return null;
            } else {
                throw e;
            }
        }
    }


    private async obtainMetrics(deploymentPatternId: string, bestMetricValues: MetricWrapper[], qualityAttributeName: string): Promise<MetricWrapper[]> {

        if (bestMetricValues.length == 0) {
            let metricValueSorted: MetricWrapper[] = await this.findDepPattern(deploymentPatternId, qualityAttributeName);
            this.logger.info(`Found ${metricValueSorted.length} experiments for deployment pattern ${deploymentPatternId}`);
            let i: number = 0;
            while (i < metricValueSorted.length && metricValueSorted[i].metricValue == metricValueSorted[0].metricValue) {
                bestMetricValues.push(metricValueSorted[i]);
                i++;
            }
            this.logger.info(`Shorten array from ${metricValueSorted.length} to ${bestMetricValues.length}`);

        } else if (bestMetricValues.length > 1) {
            let metricValueSorted: MetricWrapper[] = await this.findExperiments(bestMetricValues.map((value) => value.experimentId), qualityAttributeName);
            this.logger.info(`Found ${metricValueSorted.length} experiments`);
            bestMetricValues = [];
            let i: number = 0;
            while (i < metricValueSorted.length && metricValueSorted[i].metricValue == metricValueSorted[0].metricValue) {
                bestMetricValues.push(metricValueSorted[i]);
                i++;
            }
            this.logger.info(`Shorten array from ${metricValueSorted.length} to ${bestMetricValues.length}`);
        }
        return bestMetricValues;
    }

    private async findDepPattern(deploymentPattern: string, attributeName: string): Promise<MetricWrapper[]> {

        if (attributeName === 'syncStatePriority') {
            return await this.repository.findAllForDeploymentPatternSortByNotSyncNodesCount(deploymentPattern);
        } else if (attributeName == 'acceptedTxRatePriority') {
            return await this.repository.findAllForDeploymentPatternSortByAcceptedTxCount(deploymentPattern);
        } else if (attributeName == 'medianTxAcceptanceTimePriority') {
            return await this.repository.findAllForDeploymentPatternSortByMedianAcceptanceTime(deploymentPattern);
        } else if (attributeName == 'infrastructureRes') {
            return await this.repository.findAllForDeploymentPatternSortByInfResUtil(deploymentPattern);
        }
    }

    private async findExperiments(experimentsIds: string[], attributeName: string): Promise<MetricWrapper[]> {

        if (attributeName === 'syncStatePriority') {
            return await this.repository.findAllForExperimentsSortByNotSyncNodesCount(experimentsIds);
        } else if (attributeName == 'acceptedTxRatePriority') {
            return await this.repository.findAllForExperimentsSortByAcceptedTxCount(experimentsIds);
        } else if (attributeName == 'medianTxAcceptanceTimePriority') {
            return await this.repository.findAllForExperimentsSortByMedianAcceptanceTime(experimentsIds);
        } else if (attributeName == 'infrastructureRes') {
            return await this.repository.findAllForExperimentsSortByInfResUtil(experimentsIds);
        }
    }


    async readAllByDeploymentPatternId(): Promise<Experiment[]> {
        return undefined;
    }

    async delete(id: string) {
        this.logger.info('Removing Experiment with ID = ' + id);

        let experimentDataModel: ExperimentDataModel = null;
        try {
            experimentDataModel = await this.repository.readOneById(id);
        } catch (e) {

        }


        if (!experimentDataModel) {
            this.logger.debug(`No Experiment with ID = ${id} found, nothing to remove`);
            return;
        }
        try {
            await this.topologyService.delete(experimentDataModel.topology_id.toHexString());
        } catch (e) {

        }
        try {
            if (experimentDataModel.benchmark_id) {
                await this.expResultService.delete(experimentDataModel.benchmark_id.toHexString());
            }
        } catch (e) {

        }

        try {
            await this.repository.delete(id);
            this.logger.info(`Removed Experiment with id = ${id}`);
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('Experiment hasnt been removed');
            } else {
                throw e;
            }
        }
    }

}