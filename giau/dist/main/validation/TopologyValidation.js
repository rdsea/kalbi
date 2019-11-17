"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationException_1 = require("./ValidationException");
const NodeStructureValidation_1 = require("./NodeStructureValidation");
class TopologyValidation {
    static validate(dto) {
        if (!dto.structure) {
            throw new ValidationException_1.ValidationException('Invalid Topology');
        }
        NodeStructureValidation_1.NodeStructureValidation.validate(dto.structure);
    }
}
exports.TopologyValidation = TopologyValidation;
//# sourceMappingURL=TopologyValidation.js.map