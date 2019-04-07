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
const BenchmarkValidation_1 = require("../validation/BenchmarkValidation");
class BenchmarkService {
    constructor(repository, logger) {
        this.repository = repository;
        this.logger = logger;
    }
    create(benchmark) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                BenchmarkValidation_1.BenchmarkValidation.validate(benchmark);
                let dataModel = this.repository.DtoToModel(benchmark);
                dataModel = yield this.repository.create(dataModel);
                benchmark = this.repository.modelToDto(dataModel);
                this.logger.info(`Created Benchmark with id = ${benchmark._id}`);
                return benchmark;
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('Benchmark hasnt been created');
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
                let benchmarkModel = yield this.repository.readOneById(id);
                if (benchmarkModel) {
                    let benchmark = this.repository.modelToDto(benchmarkModel);
                    return benchmark;
                }
                else {
                    return null;
                }
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
    readAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let benchmarks = [];
                let benchmarkDataModels = yield this.repository.readAll();
                if (benchmarkDataModels) {
                    for (let benchmark of benchmarkDataModels) {
                        benchmarks.push(this.repository.modelToDto(benchmark));
                    }
                }
                return benchmarks;
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
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.repository.delete(id);
                this.logger.info(`Removed Benchmark with id = ${id}`);
            }
            catch (e) {
                if (e instanceof PersistenceException_1.PersistenceException) {
                    throw new ServiceException_1.ServiceException('No Benchmark has been removed');
                }
                else {
                    throw e;
                }
            }
        });
    }
}
exports.BenchmarkService = BenchmarkService;
