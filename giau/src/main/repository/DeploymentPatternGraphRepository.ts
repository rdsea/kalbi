import {IDeploymentPatternGraphRepository, IGraphDBAPI} from "./interfaces";
import {DeploymentPattern, ResourceType, DPNode} from "../model/dtos";
import {Logger} from "log4js";
import * as crypto from "crypto";
import {PersistenceException} from "./PersistenceException";


export class DeploymentPatternGraphRepository implements IDeploymentPatternGraphRepository {

    private visitedNode = {};
    private createNodesCypher: string;
    private createRelsCypher: string;


    constructor(private graphDB: IGraphDBAPI, private logger: Logger) {
    }

    async create(dataModel: DeploymentPattern): Promise<DeploymentPattern> {

        try {
            this.visitedNode = {};
            this.createNodesCypher = '';
            this.createRelsCypher = '';

            this.createGraphTopologyRec(dataModel.structure);

            let hashedValue = crypto.createHmac('sha256', '1234567890')
                .update(JSON.stringify(dataModel))
                .digest('base64');

            let createDepPatternQuery: string = `CREATE (depPattern: DeploymentPattern {id: '${hashedValue}', name: 'Deployment Pattern', description: '${dataModel.name}'})`;
            let createConnectionToStructureQuery: string = `CREATE (depPattern)-[:HAS_STRUCTURE]->(${dataModel.structure.name})`;

            let graphRequest: string = this.createNodesCypher + '\n' + createDepPatternQuery + '\n' + this.createRelsCypher + '\n' + createConnectionToStructureQuery;

            await this.graphDB.makeGraphRequest(graphRequest);

            dataModel._id = hashedValue;

            return dataModel;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }

    }

    private createGraphTopologyRec(node: DPNode) {

        if (this.visitedNode[node.name]) {
            return;
        }

        this.visitedNode[node.name] = true;

        let resourceTypeString: string = ResourceType[node.resourceType];
        resourceTypeString = this.capitalizeFirstLetter(resourceTypeString);


        let createNodeCypher: string = `CREATE (${node.name}:${resourceTypeString} {name: '${node.name}', resourceType: '${ResourceType[node.resourceType]}'})`;

        this.createNodesCypher = this.createNodesCypher + createNodeCypher + '\n';

        for (let peer of node.peers) {

            let peerTypeString: string = ResourceType[peer.resourceType];
            peerTypeString = this.capitalizeFirstLetter(peerTypeString);

            let createRelCypher: string = `CREATE (${node.name})-[:CONNECTED_TO]->(${peer.name})`;

            this.createRelsCypher = this.createRelsCypher + createRelCypher + '\n';

            this.createGraphTopologyRec(peer);
        }

    }

    private capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    delete(id: string) {
    }

    async readOneById(id: string): Promise<DeploymentPattern> {
        try {
            let query: string = 'MATCH path = (dep:DeploymentPattern{id:\'' + id + '\'})-[:HAS_STRUCTURE]-(m)-[:CONNECTED_TO*]-(n)\n' +
                'WITH collect(path) as paths\n' +
                'CALL apoc.convert.toTree(paths) yield value\n' +
                'RETURN value;';

            let result = await this.graphDB.makeGraphRequest(query);

            if (!result.records || result.records.length == 0) {
                return null;
            }

            return this.createDeploymentPatternFromGraphResponse(result.records[0]);
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    async readAll(): Promise<DeploymentPattern[]> {

        try {
            let allPatterns: DeploymentPattern[] = [];
            let query: string = 'MATCH path = (dep:DeploymentPattern{})-[:HAS_STRUCTURE]-(m)-[:CONNECTED_TO*]-(n)\n' +
                'WITH collect(path) as paths\n' +
                'CALL apoc.convert.toTree(paths) yield value\n' +
                'RETURN value;';

            let result = await this.graphDB.makeGraphRequest(query);

            for (let record of result.records) {

                let depPattern: DeploymentPattern = this.createDeploymentPatternFromGraphResponse(record);

                if (depPattern) {
                    allPatterns.push(depPattern);
                }
            }

            return allPatterns;
        } catch (e) {
            this.logger.warn('Persistence Layer Exception: ' + e);
            throw new PersistenceException(e);
        }
    }

    private createDeploymentPatternFromGraphResponse(record): DeploymentPattern {

        let fields = record._fields[0];

        if (!fields || !fields._id || !fields.has_structure) {
            return null;
        }

        let depPattern: DeploymentPattern = {
            name: fields.name,
            _id: fields.id,
            structure: this.createPureNodeFromGraphResponse(fields.has_structure[0])
        };

        return depPattern;

    }

    private createPureNodeFromGraphResponse(resp): DPNode {

        let peers: DPNode[] = [];

        if (resp.connected_to) {

            for (let rawNode of resp.connected_to) {

                let pureNode: DPNode = this.createPureNodeFromGraphResponse(rawNode);
                peers.push(pureNode);
            }
        }

        let type: ResourceType = null;
        if (resp.resourceType === 'VEHICLE_IOT') {
            type = ResourceType.VEHICLE_IOT;
        } else if (resp.resourceType === 'RSU_RESOURCE') {
            type = ResourceType.RSU_RESOURCE;
        } else if (resp.resourceType === 'EDGE_SERVICE') {
            type = ResourceType.EDGE_SERVICE;
        } else if (resp.resourceType === 'CLOUD_SERVICE') {
            type = ResourceType.CLOUD_SERVICE;
        }

        let pureNode: DPNode = {
            name: resp.name,
            peers: peers,
            resourceType: type
        };

        return pureNode;
    }

    update(id: string, data: DeploymentPattern): Promise<DeploymentPattern> {
        return undefined;
    }


}