import {ISoftwareArtefactsRepository} from "../repository/interfaces";
import {BlockchainArtefact, SoftwareArtefact} from "../model/dtos";
import {Logger} from "log4js";
import {ISoftwareArtefactsService} from "./interfaces";
import {BlockchainArtefactDataModel, SoftwareArtefactDataModel} from "../model/data_models";
import {ServiceException} from "./ServiceException";
import {PersistenceException} from "../repository/PersistenceException";
import {SoftwareArtefactValidation} from "../validation/SoftwareArtefactValidation";


export class SoftwareArtefactService implements ISoftwareArtefactsService {

    constructor(private repository: ISoftwareArtefactsRepository, private logger: Logger) {

    }

    public async create(arterfact: SoftwareArtefact): Promise<SoftwareArtefact> {

        try {
            SoftwareArtefactValidation.validate(arterfact);
            if ((<BlockchainArtefact>arterfact).bcMetadata) { // if arterfact is type of BlockchainArtefact
                let bcArterfact: BlockchainArtefactDataModel = await this.repository.readByBlockchainArtefact(<BlockchainArtefact> arterfact);
                if (bcArterfact) {
                    return this.repository.modelToDto(bcArterfact);
                }
            } else {
                let softArtefact: SoftwareArtefactDataModel = await this.repository.readBySoftwareArtefact(arterfact);
                if (softArtefact) {
                    return this.repository.modelToDto(softArtefact);
                }
            }
            let model: SoftwareArtefactDataModel = this.repository.DtoToModel(arterfact);
            arterfact = this.repository.modelToDto(await this.repository.create(model));
            this.logger.info(`Created SoftwareArtefact with id = ` + arterfact._id);
            return arterfact;
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('SoftwareArtefact hasnt been created');
            } else {
                throw e;
            }
        }
    }

    public async readAll(): Promise<SoftwareArtefact[]> {
        try {
            let dtoArtefacts: SoftwareArtefact[] = [];
            let artefacts: SoftwareArtefactDataModel[] = await this.repository.readAll();

            if (artefacts) {
                for (let artefact of artefacts) {
                    let dto: SoftwareArtefact = this.repository.modelToDto(artefact);
                    dtoArtefacts.push(dto);
                }
            }
            return dtoArtefacts;
        } catch (e) {
            if (e instanceof PersistenceException) {
                return [];
            } else {
                throw e;
            }
        }
    }

    public async readOne(id: string): Promise<SoftwareArtefact> {
        try {
            let model: SoftwareArtefactDataModel = await this.repository.readOneById(id);
            return this.repository.modelToDto(model);
        } catch (e) {
            if (e instanceof PersistenceException) {
                return null;
            } else {
                throw e;
            }
        }
    }

    public async delete(id: string) {
        try {
            await this.repository.delete(id);
            this.logger.info(`Removed SoftwareArtefact with id = ${id}`);
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('SoftwareArtefact hasnt been removed');
            } else {
                throw e;
            }
        }
    }
}