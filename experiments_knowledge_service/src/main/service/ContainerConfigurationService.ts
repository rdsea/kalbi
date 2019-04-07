import {IContainerRepository} from "../repository/interfaces";
import {ContainerConfiguration} from "../model/dtos";
import {Logger} from "log4js";
import {IContainerConfigurationService} from "./interfaces";
import {ContainerConfigurationDataModel} from "../model/data_models";
import {ServiceException} from "./ServiceException";
import {PersistenceException} from "../repository/PersistenceException";
import {ContainerConfigurationValidation} from "../validation/ContainerConfigurationValidation";


export class ContainerConfigurationService implements IContainerConfigurationService {


    constructor(private repository: IContainerRepository, private logger: Logger) {

    }

    public async create(vm: ContainerConfiguration): Promise<ContainerConfiguration> {

        try {
            ContainerConfigurationValidation.validate(vm);
            let existingVM: ContainerConfiguration = this.repository.modelToDto(await this.repository.readByConfiguration(vm));
            if (existingVM) {
                return existingVM;
            }
            let vmDataModel: ContainerConfigurationDataModel = this.repository.DtoToModel(vm);
            vm = this.repository.modelToDto(await this.repository.create(vmDataModel));

            this.logger.info(`Created VirtualMachineConfiguration with id = ` + vm._id);
            return vm;
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('ContainerConfiguration hasn\'t been created');
            } else {
                throw e;
            }
        }

    }

    public async readAll(): Promise<ContainerConfiguration[]> {

        try {
            let vms: ContainerConfiguration[] = [];
            let vmsDataModel: ContainerConfigurationDataModel[] = await this.repository.readAll();
            if (vmsDataModel) {
                for (let vmDataModel of vmsDataModel) {
                    vms.push(this.repository.modelToDto(vmDataModel));
                }
            }
            return vms;
        } catch (e) {
            if (e instanceof PersistenceException) {
                return [];
            } else {
                throw e;
            }
        }
    }

    public async readOne(id: string): Promise<ContainerConfiguration> {
        try {
            let vmDataModel: ContainerConfigurationDataModel = await this.repository.readOneById(id);
            return this.repository.modelToDto(vmDataModel);
        } catch (e) {
            if (e instanceof PersistenceException) {
                return null;
            } else {
                throw e;
            }
        }
    }

    public async delete(id: string) {
        try {
            await this.repository.delete(id);
            this.logger.info(`Removed ContainerConfiguration with id = ${id}`);
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('No ContainerConfiguration has been removed');
            } else {
                throw e;
            }
        }
    }

}