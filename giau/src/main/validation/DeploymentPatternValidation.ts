import {DeploymentPattern, PureNode} from "../model/dtos";
import {ValidationException} from "./ValidationException";
import {Utils} from "./Utils";


export class DeploymentPatternValidation {

    static validate(dto: DeploymentPattern) {

        if (!dto.name || !dto.structure) {
            throw new ValidationException('Invalid DeploymentPattern');
        }

        this.validatePureNode(dto.structure);
    }

    static validatePureNode(pureNode: PureNode) {
        if (!pureNode.hasOwnProperty('nodeType') || !pureNode.name) {
            throw new ValidationException('Invalid PureNode');
        }

        pureNode.nodeType = Utils.convertStringToNumber(pureNode.nodeType);

        if (pureNode.peers) {
            for (let i = 0; i < pureNode.peers.length; i++) {
                this.validatePureNode(pureNode.peers[i]);
            }
        }
    }
}