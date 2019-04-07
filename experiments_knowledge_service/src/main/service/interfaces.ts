import {
    DeploymentPattern,
    Experiment,
    Benchmark,
    Node,
    SoftwareArtefact,
    Topology,
    ContainerConfiguration, PureNode
} from "../model/dtos";


export interface INodeStructureService {

    create(rootNodeOfStructure: Node): Promise<Node>;

    readStructure(rootNodeOfStructureId: string): Promise<Node>;

    deleteStructure(rootNodeOfStructureId: string);

}

export interface ISoftwareArtefactsService {

    create(arterfact: SoftwareArtefact): Promise<SoftwareArtefact>;

    readAll(): Promise<SoftwareArtefact[]>;

    readOne(id: string): Promise<SoftwareArtefact>;

    delete(id: string);

}

export interface IContainerConfigurationService {

    create(vm: ContainerConfiguration): Promise<ContainerConfiguration>;

    readAll(): Promise<ContainerConfiguration[]>;

    readOne(id: string): Promise<ContainerConfiguration>;

    delete(id: string);

}

export interface ITopologyService {

    create(topology: Topology): Promise<Topology>;

    readOne(id: string): Promise<Topology>;

    readAll(): Promise<Topology[]>;

    delete(id: string);

}

export interface IExperimentService {

    create(experiment: Experiment): Promise<Experiment>;

    readOne(id: string): Promise<Experiment>;

    readBestExperimentByEvaluationMetric(
        deploymentPatternId: string,
        syncStatePriority: number,
        acceptedTxRatePriority: number,
        mediumAcceptanceTxTimePriority: number,
        infrastructureRes: number
    ): Promise<Experiment>;

    readAll(): Promise<Experiment[]>;

    delete(id: string);

}

export interface IBenchmarkService {

    create(experimentResult: Benchmark): Promise<Benchmark>;

    readOne(id: string): Promise<Benchmark>;

    readAll(): Promise<Benchmark[]>;

    delete(id: string);

}

export interface IDeploymentPatternService {

    create(depPattern: DeploymentPattern): Promise<DeploymentPattern>;

    createFromExperiment(experiment: Experiment): Promise<DeploymentPattern>;

    readOne(id: string): Promise<DeploymentPattern>;

    readAll(): Promise<DeploymentPattern[]>;

    delete(id: string);

}

export interface IRecommendationService {

    findMostSimilarDeploymentPattern(node: PureNode): Promise<DeploymentPattern>;

    bestBenchmarkForDeploymentPattern(deploymentPatternId: string, syncStatePriority: number, acceptedTxRatePriority: number, mediumAcceptanceTxTimePriority: number, infrastructureRes: number): Promise<Experiment>;

    recommendTopology(node: PureNode, syncStatePriority: number, acceptedTxRatePriority: number, medianAcceptanceTxTimePriority: number, infrastructureRes: number): Promise<Topology>;

    recommendTopologyTOSCA(toscaTopologyDefinitionYamlString: string, syncStatePriority: number, acceptedTxRatePriority: number, medianAcceptanceTxTimePriority: number, infrastructureRes: number): Promise<any>;

}