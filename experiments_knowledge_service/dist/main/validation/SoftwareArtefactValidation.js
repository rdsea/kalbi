"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationException_1 = require("./ValidationException");
class SoftwareArtefactValidation {
    static validate(artefact) {
        if (!artefact.name) {
            throw new ValidationException_1.ValidationException('Software Artefact name is missing');
        }
        if (!artefact.executionEnvironment) {
            throw new ValidationException_1.ValidationException('Software Artefact executionEnvironment is missing');
        }
        if (!artefact.repositoryTag) {
            throw new ValidationException_1.ValidationException('Software Artefact repositoryTag is missing');
        }
        if (artefact.bcMetadata) { //TODO this is agains the SOLID principles
            let bcartefact = artefact;
            if (!bcartefact.bcMetadata.featureName) {
                throw new ValidationException_1.ValidationException('Blockchain Artefact featureName is missing');
            }
            if (!bcartefact.bcMetadata.implementation) {
                throw new ValidationException_1.ValidationException('Blockchain Artefact implementation is missing');
            }
        }
    }
}
exports.SoftwareArtefactValidation = SoftwareArtefactValidation;
