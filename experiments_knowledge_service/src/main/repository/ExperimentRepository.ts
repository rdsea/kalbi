import {AbsCRUDMongoDBRepository} from "./AbsCRUDMongoDBRepository";
import {ExperimentDataModel} from "../model/data_models";
import {IExperimentRepository} from "./interfaces";
import {AggregationCursor, Db, ObjectId} from "mongodb";
import {Logger} from "log4js";
import {PersistenceException} from "./PersistenceException";
import {MongoDb} from "./MongoDb";

export interface MetricWrapper {
    experimentId: string,
    metricValue: number
}

export class ExperimentRepository extends AbsCRUDMongoDBRepository<ExperimentDataModel> implements IExperimentRepository {

    constructor(mongoDb: MongoDb, logger: Logger) {
        super(mongoDb, 'experiment', logger);
    }

    async findAllForDeploymentPatternSortByAcceptedTxCount(deploymentPatternId: string): Promise<MetricWrapper[]> {

        try {
            let matchFunction: Object = {
                $match: {
                    benchmark_id: {
                        $ne: null
                    },
                    deployment_pattern_id: `${deploymentPatternId}`
                }
            };

            let pipeline: Object[] = this.insertToArrayIndex(0, this.queryMinimumTxAcceptanceCount, matchFunction);

            let result: AggregationCursor<any> = await this.db.collection<any>(this.collectionName).aggregate(pipeline);
            let reliabilitySorted: MetricWrapper[] = [];
            let results: any[] = await result.toArray();
            for (let result of results) {
                let reliabilityWrapper: MetricWrapper = {
                    experimentId: result._id,
                    metricValue: result.acceptedTxCount
                };
                reliabilitySorted.push(reliabilityWrapper);
            }
            return reliabilitySorted;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }


    }

    async findAllForDeploymentPatternSortByNotSyncNodesCount(deploymentPatternId: string): Promise<MetricWrapper[]> {

        try {
            let matchFunction: Object = {
                $match: {
                    benchmark_id: {
                        $ne: null
                    },
                    deployment_pattern_id: `${deploymentPatternId}`
                }
            };

            let pipeline: Object[] = this.insertToArrayIndex(0, this.queryMinimumNotSyncNodesCount, matchFunction);

            let result: AggregationCursor<any> = await this.db.collection<any>(this.collectionName).aggregate(pipeline);

            let reliabilitySorted: MetricWrapper[] = [];
            let results: any[] = await result.toArray();
            for (let result of results) {
                let reliabilityWrapper: MetricWrapper = {
                    experimentId: result._id,
                    metricValue: result.notSyncedNodeCount
                };
                reliabilitySorted.push(reliabilityWrapper);
            }
            return reliabilitySorted;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }

    }


    async findAllForDeploymentPatternSortByMedianAcceptanceTime(deploymentPatternId: string): Promise<MetricWrapper[]> {

        try {
            let matchFunction: Object = {
                $match: {
                    deployment_pattern_id: `${deploymentPatternId}`,
                    benchmark_id: {
                        $ne: null
                    }
                }
            };

            let pipeline: Object[] = this.insertToArrayIndex(0, this.queryMinimumMedianAcceptanceTime, matchFunction);


            let result: AggregationCursor<any> = await this.db.collection<any>(this.collectionName).aggregate(pipeline);

            let performanceArray: MetricWrapper[] = [];
            let results: any[] = await result.toArray();
            for (let result of results) {
                let performance: MetricWrapper = {
                    experimentId: result._id,
                    metricValue: result.median
                };
                performanceArray.push(performance);
            }
            return performanceArray;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }

    }

    async findAllForExperimentsSortByAcceptedTxCount(experimentIds: string[]): Promise<MetricWrapper[]> {

        try {
            let experimentObjectIds: ObjectId[] = [];

            if (!experimentIds) {
                return null;
            }

            for (let expId of experimentIds) {
                experimentObjectIds.push(new ObjectId(expId));
            }

            let matchFunction: Object = {
                $match: {
                    benchmark_id: {
                        $ne: null
                    },
                    _id: {$in: experimentObjectIds}
                }
            };

            let pipeline: Object[] = this.insertToArrayIndex(0, this.queryMinimumTxAcceptanceCount, matchFunction);

            let result: AggregationCursor<any> = await this.db.collection<any>(this.collectionName).aggregate(pipeline);
            let reliabilitySorted: MetricWrapper[] = [];
            let results: any[] = await result.toArray();
            for (let result of results) {
                let reliabilityWrapper: MetricWrapper = {
                    experimentId: result._id,
                    metricValue: result.acceptedTxCount
                };
                reliabilitySorted.push(reliabilityWrapper);
            }
            return reliabilitySorted;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    async findAllForExperimentsSortByMedianAcceptanceTime(experimentIds: string[]): Promise<MetricWrapper[]> {

        try {
            let experimentObjectIds: ObjectId[] = [];

            if (!experimentIds) {
                return null;
            }

            for (let expId of experimentIds) {
                experimentObjectIds.push(new ObjectId(expId));
            }

            let matchFunction: Object = {
                $match: {
                    benchmark_id: {
                        $ne: null
                    },
                    _id: {$in: experimentObjectIds}
                }
            };

            let pipeline: Object[] = this.insertToArrayIndex(0, this.queryMinimumMedianAcceptanceTime, matchFunction);
            let result: AggregationCursor<any> = await this.db.collection<any>(this.collectionName).aggregate(pipeline);

            let performanceArray: MetricWrapper[] = [];
            let results: any[] = await result.toArray();
            for (let result of results) {
                let performance: MetricWrapper = {
                    experimentId: result._id,
                    metricValue: result.median
                };
                performanceArray.push(performance);
            }
            return performanceArray;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }

    }

    async findAllForExperimentsSortByNotSyncNodesCount(experimentIds: string[]): Promise<MetricWrapper[]> {

        try {
            let experimentObjectIds: ObjectId[] = [];

            if (!experimentIds) {
                return null;
            }

            for (let expId of experimentIds) {
                experimentObjectIds.push(new ObjectId(expId));
            }

            let matchFunction: Object = {
                $match: {
                    benchmark_id: {
                        $ne: null
                    },
                    _id: {$in: experimentObjectIds}
                }
            };

            let pipeline: Object[] = this.insertToArrayIndex(0, this.queryMinimumNotSyncNodesCount, matchFunction);

            let result: AggregationCursor<any> = await this.db.collection<any>(this.collectionName).aggregate(pipeline);

            let reliabilitySorted: MetricWrapper[] = [];
            let results: any[] = await result.toArray();
            for (let result of results) {
                let reliabilityWrapper: MetricWrapper = {
                    experimentId: result._id,
                    metricValue: result.notSyncedNodeCount
                };
                reliabilitySorted.push(reliabilityWrapper);
            }
            return reliabilitySorted;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }

    }

    async findAllForDeploymentPatternSortByInfResUtil(deploymentPatternId: string): Promise<MetricWrapper[]> {

        try {
            let matchFunction: Object = {
                $match: {
                    deployment_pattern_id: `${deploymentPatternId}`,
                    benchmark_id: {
                        $ne: null
                    }
                }
            };

            let pipeline: Object[] = this.insertToArrayIndex(0, this.queryMinimumInfResourceUtil, matchFunction);


            let result: AggregationCursor<any> = await this.db.collection<any>(this.collectionName).aggregate(pipeline);

            let utilizationArray: MetricWrapper[] = [];
            let results: any[] = await result.toArray();
            for (let result of results) {
                let performance: MetricWrapper = {
                    experimentId: result._id,
                    metricValue: result.maxCpuUtil
                };
                utilizationArray.push(performance);
            }
            return utilizationArray;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    async findAllForExperimentsSortByInfResUtil(experimentIds: string[]): Promise<MetricWrapper[]> {

        try {
            let experimentObjectIds: ObjectId[] = [];

            if (!experimentIds) {
                return null;
            }

            for (let expId of experimentIds) {
                experimentObjectIds.push(new ObjectId(expId));
            }

            let matchFunction: Object = {
                $match: {
                    benchmark_id: {
                        $ne: null
                    },
                    _id: {$in: experimentObjectIds}
                }
            };

            let pipeline: Object[] = this.insertToArrayIndex(0, this.queryMinimumInfResourceUtil, matchFunction);

            let result: AggregationCursor<any> = await this.db.collection<any>(this.collectionName).aggregate(pipeline);
            let infrastructureSorted: MetricWrapper[] = [];
            let results: any[] = await result.toArray();
            for (let result of results) {
                let reliabilityWrapper: MetricWrapper = {
                    experimentId: result._id,
                    metricValue: result.maxCpuUtil
                };
                infrastructureSorted.push(reliabilityWrapper);
            }
            return infrastructureSorted;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }
    }


    private insertToArrayIndex(index: number, orignal: any[], elem: any): any[] {
        let out: any[] = [];
        let i = 0;
        for (let j = 0; j < orignal.length; j++) {
            if (i == j) {
                out.push(elem);
            }
            out.push(orignal[j]);
        }
        return out;
    }


    private queryMinimumMedianAcceptanceTime: Object[] = [
        {
            $lookup: {
                from: 'benchmark',
                localField: 'benchmark_id',
                foreignField: '_id',
                as: 'benchmark'
            }
        }, {
            $project: {
                benchmark: {
                    $arrayElemAt: [
                        '$benchmark',
                        0
                    ]
                }
            }
        }, {
            $unwind: {
                path: '$benchmark.qualityAttributes'
            }
        }, {
            $match: {
                'benchmark.qualityAttributes.acceptedTxCount': {
                    $exists: true
                }
            }
        }, {
            $unwind: {
                path: '$benchmark.qualityAttributes.txResults'
            }
        }, {
            $group: {
                _id: '$_id',
                values: {
                    $push: '$benchmark.qualityAttributes.txResults.data.acceptationTime'
                }
            }
        }, {
            $project: {
                _id: 1,
                count: {
                    $size: '$values'
                },
                values: 1
            }
        }, {
            $unwind: {
                path: '$values'
            }
        }, {
            $sort: {
                values: 1
            }
        }, {
            $project: {
                _id: 1,
                count: 1,
                values: 1,
                midpoint: {
                    $divide: [
                        '$count',
                        2
                    ]
                }
            }
        }, {
            $project: {
                _id: 1,
                count: 1,
                values: 1,
                midpoint: 1,
                high: {
                    $ceil: '$midpoint'
                },
                low: {
                    $floor: '$midpoint'
                }
            }
        }, {
            $group: {
                _id: '$_id',
                values: {
                    $push: '$values'
                },
                high: {
                    $avg: '$high'
                },
                low: {
                    $avg: '$low'
                }
            }
        }, {
            $project: {
                beginValue: {
                    $arrayElemAt: [
                        '$values',
                        '$high'
                    ]
                },
                endValue: {
                    $arrayElemAt: [
                        '$values',
                        '$low'
                    ]
                }
            }
        }, {
            $project: {
                median: {
                    $avg: [
                        '$beginValue',
                        '$endValue'
                    ]
                }
            }
        }, {
            $sort: {
                median: 1
            }
        }
    ];

    private queryMinimumNotSyncNodesCount: Object[] = [
        {
            $lookup: {
                from: 'benchmark',
                localField: 'benchmark_id',
                foreignField: '_id',
                as: 'benchmark'
            }
        }, {
            $project: {
                benchmark: {
                    $arrayElemAt: [
                        '$benchmark',
                        0
                    ]
                }
            }
        }, {
            $unwind: {
                path: '$benchmark.qualityAttributes'
            }
        }, {
            $group: {
                _id: '$_id',
                notSyncedNodeCount: {
                    $sum: {
                        $cond: {
                            'if': {
                                $isArray: '$benchmark.qualityAttributes.nodesOutOfSync'
                            },
                            then: {
                                $size: '$benchmark.qualityAttributes.nodesOutOfSync'
                            },
                            'else': '0'
                        }
                    }
                }
            }
        }, {
            $sort: {
                notSyncedNodeCount: 1
            }
        }
    ];

    private queryMinimumTxAcceptanceCount: Object[] = [
        {
            $lookup: {
                from: 'benchmark',
                localField: 'benchmark_id',
                foreignField: '_id',
                as: 'benchmark'
            }
        }, {
            $project: {
                benchmark: {
                    $arrayElemAt: [
                        '$benchmark',
                        0
                    ]
                }
            }
        }, {
            $unwind: {
                path: '$benchmark.qualityAttributes'
            }
        }, {
            $group: {
                _id: '$_id',
                acceptedTxCount: {
                    $sum: '$benchmark.qualityAttributes.acceptedTxCount'
                }
            }
        }, {
            $sort: {
                acceptedTxCount: -1
            }
        }
    ];

    private queryMinimumInfResourceUtil: Object[] =
        [{
            $lookup: {
                from: 'benchmark',
                localField: 'benchmark_id',
                foreignField: '_id',
                as: 'benchmark'
            }
        }, {
            $project: {
                benchmark: {
                    $arrayElemAt: [
                        '$benchmark',
                        0
                    ]
                }
            }
        }, {
            $unwind: {
                path: '$benchmark.qualityAttributes'
            }
        },

            {
                $match: {
                    'benchmark.qualityAttributes.cpuUtil': {
                        $exists: true
                    }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    maxCpuUtil: {
                        $max: '$benchmark.qualityAttributes.cpuUtil'
                    }
                }
            },
            {
                $sort: {
                    'maxCpuUtil': 1
                }
            }


        ];

}