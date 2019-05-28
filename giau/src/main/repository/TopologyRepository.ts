import {AbsCRUDMongoDBRepository} from "./AbsCRUDMongoDBRepository";
import {TopologyDataModel} from "../model/data_models";
import {Db, ObjectId} from "mongodb";
import {ITopologyRepository} from "./interfaces";
import {Logger} from "log4js";
import {Topology} from "../model/dtos";
import {MongoDb} from "./MongoDb";


export class TopologyRepository extends AbsCRUDMongoDBRepository<TopologyDataModel> implements ITopologyRepository {


    constructor(mongoDb: MongoDb, logger: Logger) {
        super(mongoDb, 'topology', logger);
    }


    DtoToModel(dto: Topology): TopologyDataModel {
        if (!dto) {
            return null;
        }
        let id: ObjectId = dto._id ? new ObjectId(dto._id) : null;
        let model: TopologyDataModel = {
            _id: id,
            structure_root_node_id: new ObjectId(dto.structure._id),
            specificationLang: dto.specificationLang,
            specification: dto.specification,
            caption: dto.caption
        };
        return model;

    }

}