import {
    BenchmarkDataModel,
    BlockchainArtefactDataModel,
    ContainerConfigurationDataModel,
    ExperimentDataModel,
    HasObjectId,
    NodeDataModel,
    NodeJoinedDataModel,
    SoftwareArtefactDataModel,
    TopologyDataModel
} from "../model/data_models";
import {
    Benchmark,
    BlockchainArtefact,
    ContainerConfiguration,
    DeploymentPattern,
    SoftwareArtefact,
    Topology
} from "../model/dtos";
import {MetricWrapper} from "./ExperimentRepository";


export interface IAbsCRUDMongoRepository<T extends HasObjectId> {

    create(dataModel: T): Promise<T>;

    readAll(): Promise<T[]>;

    readOneById(id: string): Promise<T>;

    update(id: string, data: T): Promise<T>;

    delete(id: string);

}

export interface INodeStructureRepository extends IAbsCRUDMongoRepository<NodeDataModel> {

    readOneByIdWithArtefacts(id: string): Promise<NodeJoinedDataModel>;

}

export interface ISoftwareArtefactsRepository extends IAbsCRUDMongoRepository<SoftwareArtefactDataModel> {

    readByBlockchainArtefact(bcArtefact: BlockchainArtefact): Promise<BlockchainArtefactDataModel>;

    readBySoftwareArtefact(softArtefact: SoftwareArtefact): Promise<SoftwareArtefactDataModel>;

    DtoToModel(artefact: SoftwareArtefact): SoftwareArtefactDataModel;

    modelToDto(artefact: SoftwareArtefactDataModel): SoftwareArtefact;
}

export interface ITopologyRepository extends IAbsCRUDMongoRepository<TopologyDataModel> {

    DtoToModel(dto: Topology): TopologyDataModel;
}

export interface IExperimentRepository extends IAbsCRUDMongoRepository<ExperimentDataModel> {

    findAllForDeploymentPatternSortByMedianAcceptanceTime(deploymentPatternId: string): Promise<MetricWrapper[]>;

    findAllForExperimentsSortByMedianAcceptanceTime(experimentIds: string[]): Promise<MetricWrapper[]>;

    findAllForDeploymentPatternSortByAcceptedTxCount(deploymentPatternId: string): Promise<MetricWrapper[]>;

    findAllForExperimentsSortByAcceptedTxCount(experimentIds: string[]): Promise<MetricWrapper[]>;

    findAllForDeploymentPatternSortByNotSyncNodesCount(deploymentPatternId: string): Promise<MetricWrapper[]>;

    findAllForExperimentsSortByNotSyncNodesCount(experimentIds: string[]): Promise<MetricWrapper[]>;

    findAllForDeploymentPatternSortByInfResUtil(deploymentPatternId: string): Promise<MetricWrapper[]>;

    findAllForExperimentsSortByInfResUtil(experimentIds: string[]): Promise<MetricWrapper[]>;
}

export interface IBenchmarkRepository extends IAbsCRUDMongoRepository<BenchmarkDataModel> {

    DtoToModel(dto: Benchmark): BenchmarkDataModel;

    modelToDto(dataModel: BenchmarkDataModel): Benchmark;
}

export interface IContainerRepository extends IAbsCRUDMongoRepository<ContainerConfigurationDataModel> {

    readByConfiguration(vmConfig: ContainerConfiguration): Promise<ContainerConfigurationDataModel>;

    DtoToModel(dto: ContainerConfiguration): ContainerConfigurationDataModel;

    modelToDto(dataModel: ContainerConfigurationDataModel): ContainerConfiguration;

}

export interface IDeploymentPatternGraphRepository  {

    create(dataModel: DeploymentPattern): Promise<DeploymentPattern>;

    readAll(): Promise<DeploymentPattern[]>;

    readOneById(id: string): Promise<DeploymentPattern>;

    update(id: string, data: DeploymentPattern): Promise<DeploymentPattern>;

    delete(id: string);

}


export interface IGraphDBAPI {

    makeGraphRequest(requestCmd: string);

    closeConnection();

}