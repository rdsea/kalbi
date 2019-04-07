"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationException_1 = require("./ValidationException");
const Utils_1 = require("./Utils");
class DeploymentPatternValidation {
    static validate(dto) {
        if (!dto.name || !dto.structure) {
            throw new ValidationException_1.ValidationException('Invalid DeploymentPattern');
        }
        this.validatePureNode(dto.structure);
    }
    static validatePureNode(pureNode) {
        if (!pureNode.hasOwnProperty('nodeType') || !pureNode.name) {
            throw new ValidationException_1.ValidationException('Invalid PureNode');
        }
        pureNode.nodeType = Utils_1.Utils.convertStringToNumber(pureNode.nodeType);
        if (pureNode.peers) {
            for (let i = 0; i < pureNode.peers.length; i++) {
                this.validatePureNode(pureNode.peers[i]);
            }
        }
    }
}
exports.DeploymentPatternValidation = DeploymentPatternValidation;
