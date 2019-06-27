import {Benchmark, NetworkQuality, ResourceType} from "./experiments_knowledge_service_types";

export interface BFContainerConfiguration {
    name: string,
    vCPUcount: number,
    memory: number,
    storageSSD: number,
    storageHDD: number,
    os: string,
    provider: string
}

export enum BlockchainImpl {
    eth, hypfab
}

export interface BFHostMachine {
    name: string,
    ipAddress: string, // can never be null, when running benchmark
    configuration?: BFContainerConfiguration
}

export interface BFExperiment {
    id: number,
    name: string
    topology: BFTopology,
    benchmarkResult: Benchmark
}

export interface BFTopology {
    structure: BFNode
}


export interface BFNode {
    name: string,
    resourceType: ResourceType,
    blockchainArtefact: BFBlockchainArtefact,
    hostMachine: BFHostMachine,
    connections: BFNodeNetworkQualityAssociationClass[],
    enodeId: string
}

export interface BFNodeNetworkQualityAssociationClass {
    netQuality: NetworkQuality,
    connectionEndpoint: BFNode
}

/**
 * enums all possible bc features
 */
export enum BlockchainRole {
    none, creator, miner, all
}

export interface BFBlockchainArtefact {
    bcOperation: BlockchainRole,
    bcImplementation: BlockchainImpl
}


