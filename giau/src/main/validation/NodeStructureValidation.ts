import {BlockchainArtefact, Node, NodeNetworkQualityAssociationClass} from "../model/dtos";
import {ValidationException} from "./ValidationException";
import {ContainerConfigurationValidation} from "./ContainerConfigurationValidation";
import {SoftwareArtefactValidation} from "./SoftwareArtefactValidation";
import {Utils} from "./Utils";


export class NodeStructureValidation {

    static visited = {};

    static validate(dto: Node) {
        this.visited = {};
        this.validateRec(dto);
    }

    static validateRec(dto: Node) {

        if (!dto.hasOwnProperty('resourceType') || !dto.container || !dto.name ) {
            throw new ValidationException('Invalid Node');
        }

        if (this.visited[dto.name]) {
            return;
        }
        this.visited[dto.name] = true;

        ContainerConfigurationValidation.validate(dto.container);
        dto.resourceType = Utils.convertStringToNumber(dto.resourceType);

        if (dto.blockchainArterfacts) {
            for (let i = 0; i < dto.blockchainArterfacts.length; i++) {
                SoftwareArtefactValidation.validate(dto.blockchainArterfacts[i]);
            }
        }
        if (dto.application) {
            SoftwareArtefactValidation.validate(dto.application);
        }

        if (dto.connections) {
            for (let i = 0; i < dto.connections.length; i++) {
                let connection: NodeNetworkQualityAssociationClass = dto.connections[i];
                if (!connection.networkQuality.latency || !connection.networkQuality.bandwidth) {
                    throw new ValidationException('Invalid NodeNetworkAssociationClass, netoworkQuality');
                }
                this.validateRec(dto.connections[i].connectionEndpoint);
            }
        }

    }

}