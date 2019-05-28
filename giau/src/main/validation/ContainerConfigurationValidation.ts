import {ContainerConfiguration} from "../model/dtos";
import {ValidationException} from "./ValidationException";
import {Utils} from "./Utils";

export class ContainerConfigurationValidation {


    static validate(dto: ContainerConfiguration) {

        if (!dto.hasOwnProperty('vCPUcount') || !dto.name || !dto.hasOwnProperty('storageHDD') || !dto.os || !dto.memory || !dto.provider || !dto.hasOwnProperty('storageSSD')) {
            throw new ValidationException('ContainerConfiguration is invalid');
        }

        dto.vCPUcount = Utils.convertStringToNumber(dto.vCPUcount);
        dto.storageHDD = Utils.convertStringToNumber(dto.storageHDD);
        dto.storageSSD = Utils.convertStringToNumber(dto.storageSSD);
        dto.memory = Utils.convertStringToNumber(dto.memory);
    }



}