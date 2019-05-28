"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationException_1 = require("./ValidationException");
const BenchmarkValidation_1 = require("./BenchmarkValidation");
const TopologyValidation_1 = require("./TopologyValidation");
const DeploymentPatternValidation_1 = require("./DeploymentPatternValidation");
class ExperimentValidation {
    static validate(exp) {
        if (!exp.topology) {
            throw new ValidationException_1.ValidationException('Invalid Experiment');
        }
        if (exp.benchmark) {
            BenchmarkValidation_1.BenchmarkValidation.validate(exp.benchmark);
        }
        if (exp.depPattern) {
            DeploymentPatternValidation_1.DeploymentPatternValidation.validate(exp.depPattern);
        }
        TopologyValidation_1.TopologyValidation.validate(exp.topology);
    }
}
exports.ExperimentValidation = ExperimentValidation;
//# sourceMappingURL=ExperimentValidation.js.map