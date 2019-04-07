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
const ContainerConfigurationValidation_1 = require("../validation/ContainerConfigurationValidation");
class ContainerConfigurationService {
    constructor(repository, logger) {
        this.repository = repository;
        this.logger = logger;
    }
    create(vm) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                ContainerConfigurationValidation_1.ContainerConfigurationValidation.validate(vm);
                let existingVM = this.repository.modelToDto(yield this.repository.readByConfiguration(vm));
                if (existingVM) {
                    return existingVM;
                }
                let vmDataModel = this.repository.DtoToModel(vm);
                vm = this.repository.modelToDto(yield this.repository.create(vmDataModel));
                this.logger.info(`Created VirtualMachineConfiguration with id = ` + vm._id);
                return vm;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('ContainerConfiguration hasn\'t been created');
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
                let vms = [];
                let vmsDataModel = yield this.repository.readAll();
                if (vmsDataModel) {
                    for (let vmDataModel of vmsDataModel) {
                        vms.push(this.repository.modelToDto(vmDataModel));
                    }
                }
                return vms;
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
                let vmDataModel = yield this.repository.readOneById(id);
                return this.repository.modelToDto(vmDataModel);
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
                this.logger.info(`Removed ContainerConfiguration with id = ${id}`);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('No ContainerConfiguration has been removed');
                }
                else {
                    throw e;
                }
            }
        });
    }
}
exports.ContainerConfigurationService = ContainerConfigurationService;
