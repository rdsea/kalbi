"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbsCRUDMongoDBRepository_1 = require("./AbsCRUDMongoDBRepository");
const mongodb_1 = require("mongodb");
class BenchmarkRepository extends AbsCRUDMongoDBRepository_1.AbsCRUDMongoDBRepository {
    constructor(mongoDb, logger) {
        super(mongoDb, 'benchmark', logger);
    }
    DtoToModel(dto) {
        if (!dto) {
            return null;
        }
        let id = dto._id ? new mongodb_1.ObjectId(dto._id) : null;
        let dataModel = {
            _id: id,
            qualityAttributes: dto.qualityAttributes
        };
        return dataModel;
    }
    modelToDto(dataModel) {
        if (!dataModel) {
            return null;
        }
        let dto = {
            _id: dataModel._id.toHexString(),
            qualityAttributes: dataModel.qualityAttributes
        };
        return dto;
    }
}
exports.BenchmarkRepository = BenchmarkRepository;
//# sourceMappingURL=BenchmarkRepository.js.map