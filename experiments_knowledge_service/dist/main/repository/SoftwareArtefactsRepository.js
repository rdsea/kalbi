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
class SoftwareArtefactsRepository extends AbsCRUDMongoDBRepository_1.AbsCRUDMongoDBRepository {
    constructor(mongoDb, logger) {
        super(mongoDb, 'software_artefact', logger);
    }
    readByBlockchainArtefact(bcArtefact) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.db.collection(this.collectionName).findOne({
                    executionEnvironment: bcArtefact.executionEnvironment,
                    repositoryTag: bcArtefact.repositoryTag,
                    'bcMetadata.featureName': bcArtefact.bcMetadata.featureName,
                    'bcMetadata.implementation': bcArtefact.bcMetadata.implementation
                });
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    readBySoftwareArtefact(softArtefact) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.db.collection(this.collectionName).findOne({
                    executionEnvironment: softArtefact.executionEnvironment,
                    repositoryTag: softArtefact.repositoryTag
                });
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
    DtoToModel(artefact) {
        if (!artefact) {
            return null;
        }
        if (artefact.bcMetadata) {
            let id = artefact._id ? new mongodb_1.ObjectId(artefact._id) : null;
            let model = {
                _id: id,
                executionEnvironment: artefact.executionEnvironment,
                name: artefact.name,
                repositoryTag: artefact.repositoryTag,
                bcMetadata: artefact.bcMetadata
            };
            return model;
        }
        else {
            let id = artefact._id ? new mongodb_1.ObjectId(artefact._id) : null;
            let model = {
                _id: id,
                executionEnvironment: artefact.executionEnvironment,
                name: artefact.name,
                repositoryTag: artefact.repositoryTag
            };
            return model;
        }
    }
    modelToDto(artefact) {
        if (!artefact) {
            return null;
        }
        if (artefact.bcMetadata) {
            let dto = {
                _id: artefact._id.toHexString(),
                executionEnvironment: artefact.executionEnvironment,
                name: artefact.name,
                repositoryTag: artefact.repositoryTag,
                bcMetadata: artefact.bcMetadata
            };
            return dto;
        }
        else {
            let dto = {
                _id: artefact._id.toHexString(),
                executionEnvironment: artefact.executionEnvironment,
                name: artefact.name,
                repositoryTag: artefact.repositoryTag
            };
            return dto;
        }
    }
}
exports.SoftwareArtefactsRepository = SoftwareArtefactsRepository;
