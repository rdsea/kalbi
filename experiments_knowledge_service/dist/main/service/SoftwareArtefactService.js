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
const ServiceException_1 = require("./ServiceException");
const PersistenceException_1 = require("../repository/PersistenceException");
const SoftwareArtefactValidation_1 = require("../validation/SoftwareArtefactValidation");
class SoftwareArtefactService {
    constructor(repository, logger) {
        this.repository = repository;
        this.logger = logger;
    }
    create(arterfact) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                SoftwareArtefactValidation_1.SoftwareArtefactValidation.validate(arterfact);
                if (arterfact.bcMetadata) { // if arterfact is type of BlockchainArtefact
                    let bcArterfact = yield this.repository.readByBlockchainArtefact(arterfact);
                    if (bcArterfact) {
                        return this.repository.modelToDto(bcArterfact);
                    }
                }
                else {
                    let softArtefact = yield this.repository.readBySoftwareArtefact(arterfact);
                    if (softArtefact) {
                        return this.repository.modelToDto(softArtefact);
                    }
                }
                let model = this.repository.DtoToModel(arterfact);
                arterfact = this.repository.modelToDto(yield this.repository.create(model));
                this.logger.info(`Created SoftwareArtefact with id = ` + arterfact._id);
                return arterfact;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('SoftwareArtefact hasnt been created');
                }
                else {
                    throw e;
                }
            }
        });
    }
    readAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let dtoArtefacts = [];
                let artefacts = yield this.repository.readAll();
                if (artefacts) {
                    for (let artefact of artefacts) {
                        let dto = this.repository.modelToDto(artefact);
                        dtoArtefacts.push(dto);
                    }
                }
                return dtoArtefacts;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    return [];
                }
                else {
                    throw e;
                }
            }
        });
    }
    readOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let model = yield this.repository.readOneById(id);
                return this.repository.modelToDto(model);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    return null;
                }
                else {
                    throw e;
                }
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.repository.delete(id);
                this.logger.info(`Removed SoftwareArtefact with id = ${id}`);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('SoftwareArtefact hasnt been removed');
                }
                else {
                    throw e;
                }
            }
        });
    }
}
exports.SoftwareArtefactService = SoftwareArtefactService;
