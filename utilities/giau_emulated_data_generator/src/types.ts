export interface HasUUIDProp {
    _id: string
}

/**
 * Definitions of DTOs used by the framework, some of the dto are used as data models for the entities in the database as well.
 */

/**
 * Deployment Patterns
 */

export interface DeploymentPattern extends HasUUIDProp {
    name: string,
    structure: DPNode
}


export interface DPNode {
    name: string,
    resourceType: ResourceType,
    peers: DPNode[]
}

export interface DPCloudService extends DPNode {

}

export interface DPEdgeService extends DPNode {

}

export interface DPRSUResource extends DPNode {

}

export interface DPIoTResource extends DPNode {

}

export interface DPVehicleIoT extends DPIoTResource {

}


/**
 * Software Artefacts
 */
export interface SoftwareArtefact extends HasUUIDProp {
    name: string,
    executionEnvironment: string
    repositoryTag: string
}

export interface EdgeProcessingApplication extends SoftwareArtefact {

}

export interface BlockchainArtefact extends SoftwareArtefact {
    bcMetadata: BlockchainMetadata
}


export interface BlockchainMetadata {
    featureName: string,
    implementation: string
}

/**
 * Infrastructure
 */
export interface ContainerConfiguration extends HasUUIDProp {
    name: string,
    provider: string,
    vCPUcount: number,
    memory: number,
    storageSSD: number,
    storageHDD: number,
    os: string
}


export interface NetworkQuality {
    name: string,
    bandwidth: string,
    latency: string
}


/**
 * Topology
 */
export interface Topology extends HasUUIDProp {
    caption: string,
    specification: string,
    specificationLang: string,
    structure: Node
}

/**
 * Nodes
 */

export interface Node extends HasUUIDProp {
    name: string,
    connections: NodeNetworkQualityAssociationClass[],
    application: EdgeProcessingApplication,
    blockchainArterfacts: BlockchainArtefact[],
    container: ContainerConfiguration,
    resourceType: ResourceType
}

export enum ResourceType {
    CLOUD_SERVICE = 0, EDGE_SERVICE = 1, RSU_RESOURCE = 2, VEHICLE_IOT = 3, IOT_RESOURCE = 4
}


export interface NodeNetworkQualityAssociationClass {
    connectionEndpoint: Node,
    networkQuality: NetworkQuality
}

export interface CloudService extends Node {

}

export interface EdgeService extends Node {

}

export interface RSUResource extends Node {

}

export interface IoTResource extends Node{

}

export interface VehicleIoT extends IoTResource {

}


/**
 * Experiments
 */
export interface Experiment extends HasUUIDProp {
    benchmark: Benchmark,
    topology: Topology,
    depPattern: DeploymentPattern
}


/**
 * Benchmarks
 */

export interface Benchmark extends HasUUIDProp {
    qualityAttributes: QualityMetric[]
}

export interface QualityMetric extends HasUUIDProp {
    name: string,
    description: string
}

export interface DataExchangeAnalysis extends QualityMetric {
    nodeRef: NodeRef,
    acceptedTxCount: number,
    failedTxCount: number,
    txResults: TransactionResult[]
}

export interface HardwareUtilization extends QualityMetric {
    nodeRef: NodeRef,
    cpuUtil: number,
    memoryUtil: number
}

export interface SynchronisationState extends QualityMetric {
    nodesOutOfSync: NodeRef[]
}

export interface TransactionResult {
    data: TransactionAnalysisWrapper,
    errorMsg: string
}

export interface TransactionAnalysisWrapper {
    creationTime: number,
    acceptationTime: number,
    payloadData: any
}

export interface NodeRef {
    name: string
}