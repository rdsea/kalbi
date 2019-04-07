import {AbsCRUDMongoDBRepository} from "./AbsCRUDMongoDBRepository";
import {Benchmark} from "../model/dtos";
import {IBenchmarkRepository} from "./interfaces";
import {Db, ObjectId} from "mongodb";
import {Logger} from "log4js";
import {BenchmarkDataModel} from "../model/data_models";
import {MongoDb} from "./MongoDb";


export class BenchmarkRepository extends AbsCRUDMongoDBRepository<BenchmarkDataModel> implements IBenchmarkRepository {

    constructor(mongoDb: MongoDb, logger: Logger) {
        super(mongoDb, 'benchmark', logger);
    }


    DtoToModel(dto: Benchmark): BenchmarkDataModel {
        if (!dto) {
            return null;
        }
        let id: ObjectId = dto._id ? new ObjectId(dto._id) : null;
        let dataModel: BenchmarkDataModel = {
            _id: id,
            qualityAttributes: dto.qualityAttributes
        };
        return dataModel;
    }

    modelToDto(dataModel: BenchmarkDataModel): Benchmark {
        if (!dataModel) {
            return null;
        }
        let dto: Benchmark = {
            _id: dataModel._id.toHexString(),
            qualityAttributes: dataModel.qualityAttributes
        };
        return dto;
    }

}