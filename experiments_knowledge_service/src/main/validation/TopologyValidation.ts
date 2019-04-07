import {Topology} from "../model/dtos";
import {ValidationException} from "./ValidationException";
import {NodeStructureValidation} from "./NodeStructureValidation";


export class TopologyValidation {

    static validate(dto: Topology) {
        if (!dto.structure) {
            throw new ValidationException('Invalid Topology');
        }
        NodeStructureValidation.validate(dto.structure);
    }

}