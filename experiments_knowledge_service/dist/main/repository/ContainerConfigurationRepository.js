"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const AbsCRUDMongoDBRepository_1 = require("./AbsCRUDMongoDBRepository");
const mongodb_1 = require("mongodb");
const PersistenceException_1 = require("./PersistenceException");
class ContainerConfigurationRepository extends AbsCRUDMongoDBRepository_1.AbsCRUDMongoDBRepository {
    constructor(mongoDb, logger) {
        super(mongoDb, 'container_configuration', logger);
    }
    readByConfiguration(vmConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.db.collection(this.collectionName).findOne({
                    memory: vmConfig.memory,
                    storageHDD: vmConfig.storageHDD,
                    storageSSD: vmConfig.storageSSD,
                    vCPUcount: vmConfig.vCPUcount,
                    os: vmConfig.os,
                    provider: vmConfig.provider
                });
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    DtoToModel(dto) {
        if (!dto) {
            return null;
        }
        let id = dto._id ? new mongodb_1.ObjectId(dto._id) : null;
        let model = {
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
    modelToDto(dataModel) {
        if (!dataModel) {
            return null;
        }
        let dto = {
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
exports.ContainerConfigurationRepository = ContainerConfigurationRepository;
//# sourceMappingURL=ContainerConfigurationRepository.js.map