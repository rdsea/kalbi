"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationException_1 = require("./ValidationException");
const Utils_1 = require("./Utils");
class BenchmarkValidation {
    static validate(dto) {
        if (!dto.qualityAttributes) {
            throw new ValidationException_1.ValidationException('Invalid Benchmark');
        }
        for (let i = 0; i < dto.qualityAttributes.length; i++) {
            let metric = dto.qualityAttributes[i];
            if (metric.txResults) {
                let dataMetric = metric;
                dataMetric.failedTxCount = Utils_1.Utils.convertStringToNumber(dataMetric.failedTxCount);
                dataMetric.acceptedTxCount = Utils_1.Utils.convertStringToNumber(dataMetric.acceptedTxCount);
                if (!dataMetric.nodeRef || !dataMetric.txResults || dataMetric.txResults.length != (dataMetric.acceptedTxCount + dataMetric.failedTxCount)) {
                    throw new ValidationException_1.ValidationException('Invalid DataExchangeAnalysis of Benchmark');
                }
                for (let j = 0; j < dataMetric.txResults.length; j++) {
                    if (dataMetric.txResults[j].data) {
                        dataMetric.txResults[j].data.acceptationTime = Utils_1.Utils.convertStringToNumber(dataMetric.txResults[j].data.acceptationTime);
                        dataMetric.txResults[j].data.creationTime = Utils_1.Utils.convertStringToNumber(dataMetric.txResults[j].data.creationTime);
                    }
                }
                dto.qualityAttributes[i] = dataMetric;
            }
            else if (metric.hasOwnProperty('cpuUtil')) {
                let utilMetric = metric;
                utilMetric.cpuUtil = Utils_1.Utils.convertStringToNumber(utilMetric.cpuUtil);
                utilMetric.memoryUtil = Utils_1.Utils.convertStringToNumber(utilMetric.memoryUtil);
                dto.qualityAttributes[i] = utilMetric;
            }
        }
    }
}
exports.BenchmarkValidation = BenchmarkValidation;
