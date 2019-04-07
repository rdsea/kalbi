"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationException_1 = require("./ValidationException");
const Utils_1 = require("./Utils");
class ContainerConfigurationValidation {
    static validate(dto) {
        if (!dto.hasOwnProperty('vCPUcount') || !dto.name || !dto.hasOwnProperty('storageHDD') || !dto.os || !dto.memory || !dto.provider || !dto.hasOwnProperty('storageSSD')) {
            throw new ValidationException_1.ValidationException('ContainerConfiguration is invalid');
        }
        dto.vCPUcount = Utils_1.Utils.convertStringToNumber(dto.vCPUcount);
        dto.storageHDD = Utils_1.Utils.convertStringToNumber(dto.storageHDD);
        dto.storageSSD = Utils_1.Utils.convertStringToNumber(dto.storageSSD);
        dto.memory = Utils_1.Utils.convertStringToNumber(dto.memory);
    }
}
exports.ContainerConfigurationValidation = ContainerConfigurationValidation;
