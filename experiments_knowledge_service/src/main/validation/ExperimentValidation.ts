import {Experiment} from "../model/dtos";
import {ValidationException} from "./ValidationException";
import {BenchmarkValidation} from "./BenchmarkValidation";
import {TopologyValidation} from "./TopologyValidation";
import {DeploymentPatternValidation} from "./DeploymentPatternValidation";


export class ExperimentValidation {

    static validate(exp: Experiment) {
        if (!exp.topology) {
            throw new ValidationException('Invalid Experiment');
        }
        if (exp.benchmark) {
            BenchmarkValidation.validate(exp.benchmark);
        }
        if (exp.depPattern) {
            DeploymentPatternValidation.validate(exp.depPattern);
        }
        TopologyValidation.validate(exp.topology);
    }
}