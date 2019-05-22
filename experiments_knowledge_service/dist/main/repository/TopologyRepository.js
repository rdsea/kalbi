"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbsCRUDMongoDBRepository_1 = require("./AbsCRUDMongoDBRepository");
const mongodb_1 = require("mongodb");
class TopologyRepository extends AbsCRUDMongoDBRepository_1.AbsCRUDMongoDBRepository {
    constructor(mongoDb, logger) {
        super(mongoDb, 'topology', logger);
    }
    DtoToModel(dto) {
        if (!dto) {
            return null;
        }
        let id = dto._id ? new mongodb_1.ObjectId(dto._id) : null;
        let model = {
            _id: id,
            structure_root_node_id: new mongodb_1.ObjectId(dto.structure._id),
            specificationLang: dto.specificationLang,
            specification: dto.specification,
            caption: dto.caption
        };
        return model;
    }
}
exports.TopologyRepository = TopologyRepository;
