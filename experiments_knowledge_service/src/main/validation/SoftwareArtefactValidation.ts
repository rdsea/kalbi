import {BlockchainArtefact, SoftwareArtefact} from "../model/dtos";
import {ValidationException} from "./ValidationException";

export class SoftwareArtefactValidation {


    static validate(artefact: SoftwareArtefact) {

        if (!artefact.name) {
            throw new ValidationException('Software Artefact name is missing');
        }

        if (!artefact.executionEnvironment) {
            throw new ValidationException('Software Artefact executionEnvironment is missing');
        }

        if (!artefact.repositoryTag) {
            throw new ValidationException('Software Artefact repositoryTag is missing');
        }

        if ((<BlockchainArtefact>artefact).bcMetadata) {//TODO this is agains the SOLID principles

            let bcartefact: BlockchainArtefact = <BlockchainArtefact> artefact;
            if (!bcartefact.bcMetadata.featureName) {
                throw new ValidationException('Blockchain Artefact featureName is missing');
            }
            if (!bcartefact.bcMetadata.implementation) {
                throw new ValidationException('Blockchain Artefact implementation is missing');
            }

        }
    }

}