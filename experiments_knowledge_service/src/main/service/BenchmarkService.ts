import {IBenchmarkService} from "./interfaces";
import {Benchmark} from "../model/dtos";
import {IBenchmarkRepository} from "../repository/interfaces";
import {Logger} from "log4js";
import {BenchmarkDataModel} from "../model/data_models";
import {ServiceException} from "./ServiceException";
import {PersistenceException} from "../repository/PersistenceException";
import {BenchmarkValidation} from "../validation/BenchmarkValidation";


export class BenchmarkService implements IBenchmarkService {

    constructor(private repository: IBenchmarkRepository, private logger: Logger) {

    }

    async create(benchmark: Benchmark): Promise<Benchmark> {

        try {
            BenchmarkValidation.validate(benchmark);
            let dataModel: BenchmarkDataModel = this.repository.DtoToModel(benchmark);
            dataModel = await this.repository.create(dataModel);
            benchmark = this.repository.modelToDto(dataModel);
            this.logger.info(`Created Benchmark with id = ${benchmark._id}`);
            return benchmark;

        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('Benchmark hasnt been created');
            } else {
                throw e;
            }
        }


    }

    async readOne(id: string): Promise<Benchmark> {

        try {
            let benchmarkModel: BenchmarkDataModel = await this.repository.readOneById(id);

            if (benchmarkModel) {
                let benchmark: Benchmark = this.repository.modelToDto(benchmarkModel);
                return benchmark;
            } else {
                return null;
            }
        } catch (e) {
            if (e instanceof PersistenceException) {
                return null;
            } else {
                throw e;
            }
        }

    }

    async readAll(): Promise<Benchmark[]> {

        try {
            let benchmarks: Benchmark[] = [];
            let benchmarkDataModels: BenchmarkDataModel[] = await this.repository.readAll();

            if (benchmarkDataModels) {
                for (let benchmark of benchmarkDataModels) {
                    benchmarks.push(this.repository.modelToDto(benchmark));
                }
            }

            return benchmarks;
        } catch (e) {
            if (e instanceof PersistenceException) {
                return [];
            } else {
                throw e;
            }
        }

    }

    async delete(id: string) {
        try {
            await this.repository.delete(id);
            this.logger.info(`Removed Benchmark with id = ${id}`);
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('No Benchmark has been removed');
            } else {
                throw e;
            }
        }
    }

}