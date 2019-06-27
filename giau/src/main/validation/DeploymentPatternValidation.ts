import {DeploymentPattern, DPNode} from "../model/dtos";
import {ValidationException} from "./ValidationException";
import {Utils} from "./Utils";


export class DeploymentPatternValidation {

    static validate(dto: DeploymentPattern) {

        if (!dto.name || !dto.structure) {
            throw new ValidationException('Invalid DeploymentPattern');
        }

        this.validatePureNode(dto.structure);
    }

    static validatePureNode(pureNode: DPNode) {
        if (!pureNode.hasOwnProperty('resourceType') || !pureNode.name) {
            throw new ValidationException('Invalid DPNode');
        }

        pureNode.resourceType = Utils.convertStringToNumber(pureNode.resourceType);

        if (pureNode.peers) {
            for (let i = 0; i < pureNode.peers.length; i++) {
                this.validatePureNode(pureNode.peers[i]);
            }
        }
    }
}