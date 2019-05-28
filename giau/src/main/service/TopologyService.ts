import {Topology, Node} from "../model/dtos";
import {TopologyDataModel} from "../model/data_models";
import {ITopologyRepository} from "../repository/interfaces";
import {Logger} from "log4js";
import {INodeStructureService, ITopologyService} from "./interfaces";
import {ServiceException} from "./ServiceException";
import {PersistenceException} from "../repository/PersistenceException";
import {TopologyValidation} from "../validation/TopologyValidation";


export class TopologyService implements ITopologyService {


    constructor(private repository: ITopologyRepository, private nodeStructureService: INodeStructureService, private logger: Logger) {

    }

    public async create(topology: Topology): Promise<Topology> {

        try {
            TopologyValidation.validate(topology);
            this.logger.info('Creating new Topology, caption = ' + topology.caption);
            let structure: Node = await this.nodeStructureService.create(topology.structure);
            topology.structure = structure;
            let topologyDataModel: TopologyDataModel = this.repository.DtoToModel(topology);
            topologyDataModel = await this.repository.create(topologyDataModel);
            topology._id = topologyDataModel._id.toHexString();
            this.logger.info('Created Topology, id = ' + topology._id);
            return topology;
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('Topology hasnt been created');
            } else {
                throw e;
            }
        }
    }


    public async readOne(id: string): Promise<Topology> {

        try {
            let topologyDataModel: TopologyDataModel = await this.repository.readOneById(id);

            if (!topologyDataModel) {
                return null;
            }

            let structure: Node = await this.nodeStructureService.readStructure(topologyDataModel.structure_root_node_id.toHexString());

            if (!structure) {
                await this.delete(id);
                return null;
            }

            let topology: Topology = {
                _id: topologyDataModel._id.toHexString(),
                caption: topologyDataModel.caption,
                specification: topologyDataModel.specification,
                specificationLang: topologyDataModel.specificationLang,
                structure: structure
            };

            return topology;
        } catch (e) {
            if (e instanceof PersistenceException) {
                return null;
            } else {
                throw e;
            }
        }
    }


    async readAll(): Promise<Topology[]> {

        try {
            let topologyDataModels: TopologyDataModel[] = await this.repository.readAll();

            if (!topologyDataModels) {
                return [];
            }

            let topologies: Topology[] = [];

            for (let topologyDM of topologyDataModels) {
                let topology: Topology = await this.readOne(topologyDM._id.toHexString());
                topologies.push(topology);
            }

            return topologies;
        } catch (e) {
            if (e instanceof PersistenceException) {
                return [];
            } else {
                throw e;
            }
        }
    }


    public async delete(id: string) {

        this.logger.info('Removing Topology with ID = ' + id);

        let topologyDataModel: TopologyDataModel = await this.repository.readOneById(id);

        if (!topologyDataModel) {
            this.logger.debug(`No Topology with ID = ${id} found, nothing to remove`);
            return;
        }

        try {
            await this.nodeStructureService.deleteStructure(topologyDataModel.structure_root_node_id.toHexString());
        } catch (e) {

        }

        try {
            await this.repository.delete(id);
            this.logger.info(`Removed Topology with id = ${id}`);
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('Topology hasnt been removed');
            } else {
                throw e;
            }
        }

    }

}