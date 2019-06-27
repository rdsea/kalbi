/**
 * Representation of DTOs as they are stored in a Database.
 */

import {
    BlockchainArtefact,
    EdgeProcessingApplication,
    NetworkQuality,
    ResourceType,
    ContainerConfiguration, BlockchainMetadata, QualityMetric
} from "./dtos";
import {ObjectId} from "mongodb";



export interface HasObjectId {
    _id: ObjectId;
}

export interface SoftwareArtefactDataModel extends HasObjectId {
    name: string,
    executionEnvironment: string
    repositoryTag: string
}

export interface BlockchainArtefactDataModel extends SoftwareArtefactDataModel {
    bcMetadata: BlockchainMetadata
}

export interface EdgeProcessingApplicationDataModel extends SoftwareArtefactDataModel {

}

export interface ContainerConfigurationDataModel extends HasObjectId {
    name: string,
    provider: string,
    vCPUcount: number,
    memory: number,
    storageSSD: number,
    storageHDD: number,
    os: string
}

export interface BenchmarkDataModel extends HasObjectId {
    qualityAttributes: QualityMetric[]
}

export interface TopologyDataModel extends HasObjectId {
    caption: string,
    specification: string,
    specificationLang: string,
    structure_root_node_id: ObjectId
}

export interface NodeNetworkQualityAssociationClassDataModel {
    endpoint_id: ObjectId,
    networkQuality: NetworkQuality
}

export interface NodeDataModel extends HasObjectId {
    name: string,
    application: ObjectId,
    blockchainArterfacts: ObjectId[],
    container_id: ObjectId,
    resourceType: ResourceType,
    connections: NodeNetworkQualityAssociationClassDataModel[]
}

export interface NodeJoinedDataModel extends HasObjectId {
    name: string,
    application: EdgeProcessingApplication,
    blockchainArterfacts: BlockchainArtefact[],
    container: ContainerConfiguration,
    resourceType: ResourceType,
    connections: NodeNetworkQualityAssociationClassDataModel[]
}

export interface ExperimentDataModel extends HasObjectId {
    benchmark_id: ObjectId,
    topology_id: ObjectId
    deployment_pattern_id: string
}
