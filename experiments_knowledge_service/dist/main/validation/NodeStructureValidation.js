"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationException_1 = require("./ValidationException");
const ContainerConfigurationValidation_1 = require("./ContainerConfigurationValidation");
const SoftwareArtefactValidation_1 = require("./SoftwareArtefactValidation");
const Utils_1 = require("./Utils");
class NodeStructureValidation {
    static validate(dto) {
        this.visited = {};
        this.validateRec(dto);
    }
    static validateRec(dto) {
        if (!dto.hasOwnProperty('nodeType') || !dto.container || !dto.name) {
            throw new ValidationException_1.ValidationException('Invalid Node');
        }
        if (this.visited[dto.name]) {
            return;
        }
        this.visited[dto.name] = true;
        ContainerConfigurationValidation_1.ContainerConfigurationValidation.validate(dto.container);
        dto.nodeType = Utils_1.Utils.convertStringToNumber(dto.nodeType);
        if (dto.blockchainArterfacts) {
            for (let i = 0; i < dto.blockchainArterfacts.length; i++) {
                SoftwareArtefactValidation_1.SoftwareArtefactValidation.validate(dto.blockchainArterfacts[i]);
            }
        }
        if (dto.application) {
            SoftwareArtefactValidation_1.SoftwareArtefactValidation.validate(dto.application);
        }
        if (dto.connections) {
            for (let i = 0; i < dto.connections.length; i++) {
                let connection = dto.connections[i];
                if (!connection.networkQuality.latency || !connection.networkQuality.bandwidth) {
                    throw new ValidationException_1.ValidationException('Invalid NodeNetworkAssociationClass, netoworkQuality');
                }
                this.validateRec(dto.connections[i].connectionEndpoint);
            }
        }
    }
}
NodeStructureValidation.visited = {};
exports.NodeStructureValidation = NodeStructureValidation;
//# sourceMappingURL=NodeStructureValidation.js.map