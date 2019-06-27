
export interface ICloudVMService {

    createAndStartVM(vmConfiguration: ContainerConfiguration, caption?: string): Promise<HostMachine>;

    startVM(vmName: string): Promise<string>;

    stopVM(vmName: string): Promise<any>;

    getVM(vmName: string): Promise<HostMachine>;

    findAvailableVMs(): Promise<HostMachine[]>;

}

export interface IResourceUtilizationObtainer {

    obtainResourceUtilizationOfTopology(topology: Topology): Promise<UtilizationAtNodesMapWithKeys>;

}

export interface IV2XRunner {

    runV2XEnv(topology: Topology);

    killSimulationContainers(topology: Topology);

    isSimulationRunning(topology: Topology): Promise<boolean>;

}

export interface ITopologyDeployer {

    deployTopology(topology: Topology);

    obtainNodeNamesOutOfSync(topology: Topology): Promise<string[]>;

    deployNetworkQuality(node: Topology);
}

export interface ITopologyKiller {

    killTopology(topology: Topology);

    resetNetworkQuality(topology: Topology);
}

export interface INetworkConfigurator {

    setupNetworkQualityInTopology(topology: Topology);

    resetNetworkQualityInTopology(topology: Topology);

}


export interface Configuration {
    resultsDir: string,
    sshKeyPath: string,
    sshUsername: string,
    infrastructureProvider: InfrastructureProviderAuthMetadata
}

export interface InfrastructureProviderAuthMetadata {
    name: string,
    projectId: string,
    serviceAccountKeyFilename: string,
    zoneName: string
}


export interface ExperimentsConfiguration {
    name: string,
    description: string
    workloadEmulator: WorkloadEmulator,
    roundsNr: number
    bcImplementations: BlockchainImpl[],
    bcDeployments: Deployment[],
    vehicleContainerConfigurations: ContainerConfiguration[],
    networkQualities: NetworkQuality[]
}

export interface WorkloadEmulator {
    type: string,
    imageTag: string
}

export interface Deployment {
    id: number,
    featuresMapping: BlockchainOperationComponentMapping[]
}


export interface BlockchainOperationComponentMapping {
    resourceType: ResourceType,
    feature: BlockchainRole
}

export interface ContainerConfiguration {
    name: string,
    vCPUcount: number,
    memory: number,
    storageSSD: number,
    storageHDD: number,
    provider: string,
    os: string
}


export interface HostMachine {
    name: string,
    ipAddress: string, // can never be null, when running benchmark
    configuration?: ContainerConfiguration
}

export enum BlockchainImpl {
    eth, hypfab
}

export interface Experiment {
    id: number,
    name: string
    topology: Topology,
    benchmarkResult: BenchmarkResult
}

export interface Topology {
    structure: Node
}


export interface Node {
    name: string,
    resourceType: ResourceType,
    blockchainArtefact: BlockchainArtefact,
    hostMachine: HostMachine,
    connections: NodeNetworkQualityAssociationClass[],
    enodeId: string
}

export interface NodeNetworkQualityAssociationClass {
    netQuality: NetworkQuality,
    connectionEndpoint: Node
}


export interface BlockchainArtefact {
    bcOperation: BlockchainRole,
    bcImplementation: BlockchainImpl
}


export enum ResourceType {
    CLOUD_SERVICE = 0, EDGE_SERVICE = 1, RSU_RESOURCE = 2, VEHICLE_IOT = 3, IOT_RESOURCE = 4
}

/**
 * enums all possible bc features
 */
export enum BlockchainRole {
    none, creator, miner, all
}

export interface NodesAtContainer {
    [containerName: string]: Node[]
}

export interface StringMap {
    [key: string]: string
}


export interface NetworkQuality {
    name: string,
    bandwidth: string,
    latency: string
}


interface DrivingData {
    id: number,
    velocity: number,
    acceleration: number
}

interface TransactionAnalysisWrapper {
    creationTime: number,
    acceptationTime: number,
    payloadData: DrivingData
}

interface TransactionResult {
    data: TransactionAnalysisWrapper,
    error: string
}

export interface BenchmarkResult {
    qualityAttributes: QualityMetric[]
}

export interface QualityMetric {
    name: string,
    description: string
}


export interface DataExchangeAnalysis extends QualityMetric {
    nodeRef: NodeRef,
    txResults: TransactionResult[], // represent the rounds
    acceptedTxCount: number,
    failedTxCount: number,
}


export interface HardwareUtilization extends QualityMetric {
    nodeRef: NodeRef,
    cpuUtil: number,
    memoryUtil: number
}

export interface SynchronisationState extends QualityMetric {
    nodesOutOfSync: NodeRef[]
}

export interface UtilizationAtNodesMap {
    [containerName: string]: HardwareUtilization,
}

export interface UtilizationAtNodesMapWithKeys {
    utilizationMap: UtilizationAtNodesMap,
    keys: string[]
}

export interface NodeRef {
    name: string
}