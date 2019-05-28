import {AbsCRUDMongoDBRepository} from "./AbsCRUDMongoDBRepository";
import {BlockchainArtefact, SoftwareArtefact} from "../model/dtos";
import {Db, ObjectId} from "mongodb";
import {ISoftwareArtefactsRepository} from "./interfaces";
import {Logger} from "log4js";
import {BlockchainArtefactDataModel, SoftwareArtefactDataModel} from "../model/data_models";
import {PersistenceException} from "./PersistenceException";
import {MongoDb} from "./MongoDb";


export class SoftwareArtefactsRepository extends AbsCRUDMongoDBRepository<SoftwareArtefactDataModel> implements ISoftwareArtefactsRepository {


    constructor(mongoDb: MongoDb, logger: Logger) {
        super(mongoDb, 'software_artefact', logger);
    }

    async readByBlockchainArtefact(bcArtefact: BlockchainArtefact): Promise<BlockchainArtefactDataModel> {

        try {
            return await this.db.collection(this.collectionName).findOne<BlockchainArtefactDataModel>(
                {
                    executionEnvironment: bcArtefact.executionEnvironment,
                    repositoryTag: bcArtefact.repositoryTag,
                    'bcMetadata.featureName': bcArtefact.bcMetadata.featureName,
                    'bcMetadata.implementation': bcArtefact.bcMetadata.implementation
                }
            );
        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }

    }

    async readBySoftwareArtefact(softArtefact: SoftwareArtefact): Promise<SoftwareArtefactDataModel> {

        try {
            return await this.db.collection(this.collectionName).findOne<SoftwareArtefactDataModel>(
                {
                    executionEnvironment: softArtefact.executionEnvironment,
                    repositoryTag: softArtefact.repositoryTag
                }
            );
        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }
    }


    DtoToModel(artefact: SoftwareArtefact): SoftwareArtefactDataModel {

        if (!artefact) {
            return null;
        }

        if ((<BlockchainArtefact>artefact).bcMetadata) {
            let id: ObjectId = artefact._id ? new ObjectId(artefact._id) : null;
            let model: BlockchainArtefactDataModel = {
                _id: id,
                executionEnvironment: artefact.executionEnvironment,
                name: artefact.name,
                repositoryTag: artefact.repositoryTag,
                bcMetadata: (<BlockchainArtefact>artefact).bcMetadata
            };
            return model;

        } else {
            let id: ObjectId = artefact._id ? new ObjectId(artefact._id) : null;
            let model: SoftwareArtefactDataModel = {
                _id: id,
                executionEnvironment: artefact.executionEnvironment,
                name: artefact.name,
                repositoryTag: artefact.repositoryTag
            };
            return model;
        }
    }

    modelToDto(artefact: SoftwareArtefactDataModel): SoftwareArtefact {

        if (!artefact) {
            return null;
        }

        if ((<BlockchainArtefactDataModel>artefact).bcMetadata) {
            let dto: BlockchainArtefact = {
                _id: artefact._id.toHexString(),
                executionEnvironment: artefact.executionEnvironment,
                name: artefact.name,
                repositoryTag: artefact.repositoryTag,
                bcMetadata: (<BlockchainArtefactDataModel>artefact).bcMetadata
            };
            return dto;

        } else {
            let dto: SoftwareArtefact = {
                _id: artefact._id.toHexString(),
                executionEnvironment: artefact.executionEnvironment,
                name: artefact.name,
                repositoryTag: artefact.repositoryTag
            };
            return dto;
        }

    }


}