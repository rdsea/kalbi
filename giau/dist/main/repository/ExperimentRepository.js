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
const AbsCRUDMongoDBRepository_1 = require("./AbsCRUDMongoDBRepository");
const mongodb_1 = require("mongodb");
const PersistenceException_1 = require("./PersistenceException");
class ExperimentRepository extends AbsCRUDMongoDBRepository_1.AbsCRUDMongoDBRepository {
    constructor(mongoDb, logger) {
        super(mongoDb, 'experiment', logger);
        this.queryMinimumMedianAcceptanceTime = [
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
        this.queryMinimumNotSyncNodesCount = [
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
        this.queryMinimumTxAcceptanceCount = [
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
        this.queryMinimumInfResourceUtil = [{
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
    findAllForDeploymentPattern(deploymentPatternId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let matchFunction = {
                    $match: {
                        benchmark_id: {
                            $ne: null
                        },
                        deployment_pattern_id: `${deploymentPatternId}`
                    }
                };
                let result = yield this.db.collection(this.collectionName).aggregate([matchFunction]);
                let results = yield result.toArray();
                return results;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    findAllForDeploymentPatternSortByAcceptedTxCount(deploymentPatternId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let matchFunction = {
                    $match: {
                        benchmark_id: {
                            $ne: null
                        },
                        deployment_pattern_id: `${deploymentPatternId}`
                    }
                };
                let pipeline = this.insertToArrayIndex(0, this.queryMinimumTxAcceptanceCount, matchFunction);
                let result = yield this.db.collection(this.collectionName).aggregate(pipeline);
                let reliabilitySorted = [];
                let results = yield result.toArray();
                for (let result of results) {
                    let reliabilityWrapper = {
                        experimentId: result._id,
                        metricValue: result.acceptedTxCount
                    };
                    reliabilitySorted.push(reliabilityWrapper);
                }
                return reliabilitySorted;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    findAllForDeploymentPatternSortByNotSyncNodesCount(deploymentPatternId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let matchFunction = {
                    $match: {
                        benchmark_id: {
                            $ne: null
                        },
                        deployment_pattern_id: `${deploymentPatternId}`
                    }
                };
                let pipeline = this.insertToArrayIndex(0, this.queryMinimumNotSyncNodesCount, matchFunction);
                let result = yield this.db.collection(this.collectionName).aggregate(pipeline);
                let reliabilitySorted = [];
                let results = yield result.toArray();
                for (let result of results) {
                    let reliabilityWrapper = {
                        experimentId: result._id,
                        metricValue: result.notSyncedNodeCount
                    };
                    reliabilitySorted.push(reliabilityWrapper);
                }
                return reliabilitySorted;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    findAllForDeploymentPatternSortByMedianAcceptanceTime(deploymentPatternId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let matchFunction = {
                    $match: {
                        deployment_pattern_id: `${deploymentPatternId}`,
                        benchmark_id: {
                            $ne: null
                        }
                    }
                };
                let pipeline = this.insertToArrayIndex(0, this.queryMinimumMedianAcceptanceTime, matchFunction);
                let result = yield this.db.collection(this.collectionName).aggregate(pipeline);
                let performanceArray = [];
                let results = yield result.toArray();
                for (let result of results) {
                    let performance = {
                        experimentId: result._id,
                        metricValue: result.median
                    };
                    performanceArray.push(performance);
                }
                return performanceArray;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    findAllForExperimentsSortByAcceptedTxCount(experimentIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let experimentObjectIds = [];
                if (!experimentIds) {
                    return null;
                }
                for (let expId of experimentIds) {
                    experimentObjectIds.push(new mongodb_1.ObjectId(expId));
                }
                let matchFunction = {
                    $match: {
                        benchmark_id: {
                            $ne: null
                        },
                        _id: { $in: experimentObjectIds }
                    }
                };
                let pipeline = this.insertToArrayIndex(0, this.queryMinimumTxAcceptanceCount, matchFunction);
                let result = yield this.db.collection(this.collectionName).aggregate(pipeline);
                let reliabilitySorted = [];
                let results = yield result.toArray();
                for (let result of results) {
                    let reliabilityWrapper = {
                        experimentId: result._id,
                        metricValue: result.acceptedTxCount
                    };
                    reliabilitySorted.push(reliabilityWrapper);
                }
                return reliabilitySorted;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    findAllForExperimentsSortByMedianAcceptanceTime(experimentIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let experimentObjectIds = [];
                if (!experimentIds) {
                    return null;
                }
                for (let expId of experimentIds) {
                    experimentObjectIds.push(new mongodb_1.ObjectId(expId));
                }
                let matchFunction = {
                    $match: {
                        benchmark_id: {
                            $ne: null
                        },
                        _id: { $in: experimentObjectIds }
                    }
                };
                let pipeline = this.insertToArrayIndex(0, this.queryMinimumMedianAcceptanceTime, matchFunction);
                let result = yield this.db.collection(this.collectionName).aggregate(pipeline);
                let performanceArray = [];
                let results = yield result.toArray();
                for (let result of results) {
                    let performance = {
                        experimentId: result._id,
                        metricValue: result.median
                    };
                    performanceArray.push(performance);
                }
                return performanceArray;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    findAllForExperimentsSortByNotSyncNodesCount(experimentIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let experimentObjectIds = [];
                if (!experimentIds) {
                    return null;
                }
                for (let expId of experimentIds) {
                    experimentObjectIds.push(new mongodb_1.ObjectId(expId));
                }
                let matchFunction = {
                    $match: {
                        benchmark_id: {
                            $ne: null
                        },
                        _id: { $in: experimentObjectIds }
                    }
                };
                let pipeline = this.insertToArrayIndex(0, this.queryMinimumNotSyncNodesCount, matchFunction);
                let result = yield this.db.collection(this.collectionName).aggregate(pipeline);
                let reliabilitySorted = [];
                let results = yield result.toArray();
                for (let result of results) {
                    let reliabilityWrapper = {
                        experimentId: result._id,
                        metricValue: result.notSyncedNodeCount
                    };
                    reliabilitySorted.push(reliabilityWrapper);
                }
                return reliabilitySorted;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    findAllForDeploymentPatternSortByInfResUtil(deploymentPatternId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let matchFunction = {
                    $match: {
                        deployment_pattern_id: `${deploymentPatternId}`,
                        benchmark_id: {
                            $ne: null
                        }
                    }
                };
                let pipeline = this.insertToArrayIndex(0, this.queryMinimumInfResourceUtil, matchFunction);
                let result = yield this.db.collection(this.collectionName).aggregate(pipeline);
                let utilizationArray = [];
                let results = yield result.toArray();
                for (let result of results) {
                    let performance = {
                        experimentId: result._id,
                        metricValue: result.maxCpuUtil
                    };
                    utilizationArray.push(performance);
                }
                return utilizationArray;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    findAllForExperimentsSortByInfResUtil(experimentIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let experimentObjectIds = [];
                if (!experimentIds) {
                    return null;
                }
                for (let expId of experimentIds) {
                    experimentObjectIds.push(new mongodb_1.ObjectId(expId));
                }
                let matchFunction = {
                    $match: {
                        benchmark_id: {
                            $ne: null
                        },
                        _id: { $in: experimentObjectIds }
                    }
                };
                let pipeline = this.insertToArrayIndex(0, this.queryMinimumInfResourceUtil, matchFunction);
                let result = yield this.db.collection(this.collectionName).aggregate(pipeline);
                let infrastructureSorted = [];
                let results = yield result.toArray();
                for (let result of results) {
                    let reliabilityWrapper = {
                        experimentId: result._id,
                        metricValue: result.maxCpuUtil
                    };
                    infrastructureSorted.push(reliabilityWrapper);
                }
                return infrastructureSorted;
            }
            catch (e) {
                this.logger.warn('Persistence Layer Exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    insertToArrayIndex(index, orignal, elem) {
        let out = [];
        out.push(elem);
        for (let j = 0; j < orignal.length; j++) {
            out.push(orignal[j]);
        }
        return out;
    }
}
exports.ExperimentRepository = ExperimentRepository;
//# sourceMappingURL=ExperimentRepository.js.map