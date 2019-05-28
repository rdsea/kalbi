import {AbsCRUDMongoDBRepository} from "./AbsCRUDMongoDBRepository";
import {ContainerConfiguration} from "../model/dtos";
import {Db, ObjectId} from "mongodb";
import {IContainerRepository} from "./interfaces";
import {Logger} from "log4js";
import {ContainerConfigurationDataModel} from "../model/data_models";
import {PersistenceException} from "./PersistenceException";
import {MongoDb} from "./MongoDb";


export class ContainerConfigurationRepository extends AbsCRUDMongoDBRepository<ContainerConfigurationDataModel> implements IContainerRepository {

    constructor(mongoDb: MongoDb, logger: Logger) {
        super(mongoDb, 'container_configuration', logger);
    }

    async readByConfiguration(vmConfig: ContainerConfiguration): Promise<ContainerConfigurationDataModel> {

        try {
            return await this.db.collection(this.collectionName).findOne<ContainerConfigurationDataModel>(
                {
                    memory: vmConfig.memory,
                    storageHDD: vmConfig.storageHDD,
                    storageSSD: vmConfig.storageSSD,
                    vCPUcount: vmConfig.vCPUcount,
                    os: vmConfig.os,
                    provider: vmConfig.provider
                }
            );
        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    DtoToModel(dto: ContainerConfiguration): ContainerConfigurationDataModel {
        if (!dto) {
            return null;
        }
        let id: ObjectId = dto._id ? new ObjectId(dto._id) : null;
        let model: ContainerConfigurationDataModel = {
            _id: id,
            memory: dto.memory,
            name: dto.name,
            os: dto.os,
            provider: dto.provider,
            storageHDD: dto.storageHDD,
            storageSSD: dto.storageSSD,
            vCPUcount: dto.vCPUcount
        };
        return model;
    }

    modelToDto(dataModel: ContainerConfigurationDataModel): ContainerConfiguration {
        if (!dataModel) {
            return null;
        }

        let dto: ContainerConfiguration= {
            _id: dataModel._id.toHexString(),
            memory: dataModel.memory,
            name: dataModel.name,
            os: dataModel.os,
            provider: dataModel.provider,
            storageHDD: dataModel.storageHDD,
            storageSSD: dataModel.storageSSD,
            vCPUcount: dataModel.vCPUcount
        };

        return dto;
    }

}