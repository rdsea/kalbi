import {
    Benchmark,
    DataExchangeAnalysis,
    QualityMetric,
    HardwareUtilization} from "../model/dtos";
import {ValidationException} from "./ValidationException";
import {Utils} from "./Utils";


export class BenchmarkValidation {

    static validate(dto: Benchmark) {

        if (!dto.qualityAttributes) {
            throw new ValidationException('Invalid Benchmark');
        }

        for (let i = 0; i < dto.qualityAttributes.length; i++) {

            let metric: QualityMetric = dto.qualityAttributes[i];

            if ((<DataExchangeAnalysis>metric).txResults) {

                let dataMetric: DataExchangeAnalysis = <DataExchangeAnalysis> metric;

                dataMetric.failedTxCount = Utils.convertStringToNumber(dataMetric.failedTxCount);
                dataMetric.acceptedTxCount = Utils.convertStringToNumber(dataMetric.acceptedTxCount);

                if (!dataMetric.nodeRef || !dataMetric.txResults || dataMetric.txResults.length != (dataMetric.acceptedTxCount + dataMetric.failedTxCount)) {
                    throw new ValidationException('Invalid DataExchangeAnalysis of Benchmark');
                }

                for (let j = 0; j < dataMetric.txResults.length; j++) {

                    if (dataMetric.txResults[j].data) {
                        dataMetric.txResults[j].data.acceptationTime = Utils.convertStringToNumber(dataMetric.txResults[j].data.acceptationTime);
                        dataMetric.txResults[j].data.creationTime = Utils.convertStringToNumber(dataMetric.txResults[j].data.creationTime);
                    }

                }

                dto.qualityAttributes[i] = dataMetric;

            } else if ((<HardwareUtilization>metric).hasOwnProperty('cpuUtil')) {

                let utilMetric: HardwareUtilization = <HardwareUtilization> metric;

                utilMetric.cpuUtil = Utils.convertStringToNumber(utilMetric.cpuUtil);
                utilMetric.memoryUtil = Utils.convertStringToNumber(utilMetric.memoryUtil);

                dto.qualityAttributes[i] = utilMetric;
            }
        }
    }
}