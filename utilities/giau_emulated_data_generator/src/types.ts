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
    structure: PureNode
}


export interface PureNode {
    name: string,
    nodeType: NodeType,
    peers: PureNode[]
}

export interface PureVehicle extends PureNode {

}

export interface PureRSU extends PureNode {

}

export interface PureEdge extends PureNode {

}

export interface PureCloud extends PureNode {

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
    nodeType: NodeType
}

export enum NodeType {
    cloud, edge, rsu, vehicle
}


export interface NodeNetworkQualityAssociationClass {
    connectionEndpoint: Node,
    networkQuality: NetworkQuality
}

export interface Vehicle extends Node {

}

export interface RSU extends Node {

}

export interface Edge extends Node {

}

export interface Cloud extends Node {

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