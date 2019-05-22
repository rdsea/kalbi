import {
    BlockchainArtefact,
    Node,
    NodeNetworkQualityAssociationClass, SoftwareArtefact
} from "../model/dtos";
import {
    NodeDataModel,
    NodeJoinedDataModel,
    NodeNetworkQualityAssociationClassDataModel
} from "../model/data_models";
import {INodeStructureRepository} from "../repository/interfaces";
import {Logger} from "log4js";
import {INodeStructureService, ISoftwareArtefactsService, IContainerConfigurationService} from "./interfaces";
import {ObjectId} from "mongodb";
import {ServiceException} from "./ServiceException";
import {PersistenceException} from "../repository/PersistenceException";
import {NodeStructureValidation} from "../validation/NodeStructureValidation";


export class NodeStructureService implements INodeStructureService {

    // private visitedNode = {};
    private nodeIdToNodeMap = {};

    public constructor(private repository: INodeStructureRepository,
                       private softwareArterfactsService: ISoftwareArtefactsService,
                       private vmService: IContainerConfigurationService,
                       private logger: Logger) {

    }


    public async create(rootNodeOfStructure: Node): Promise<Node> {
        try {
            NodeStructureValidation.validate(rootNodeOfStructure);

            this.logger.info(`Creating Structure with root Node, name = ${rootNodeOfStructure.name}`);

            // this.visitedNode = {};
            rootNodeOfStructure = await this.createStructure(rootNodeOfStructure);

            // this.visitedNode = {};
            await this.saveStructureRelationships(rootNodeOfStructure);

            this.logger.info(`Created Structure with root Node, id = ${rootNodeOfStructure._id}.`);
            return rootNodeOfStructure;
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException(`Node hasn't been created.`);
            } else {
                throw e;
            }
        }
    }


    private async saveStructureRelationships(root: Node) {

        // if (this.visitedNode[root._id]) {
        //     return;
        // }
        // this.visitedNode[root._id] = true;

        let nodeModel: NodeDataModel = await this.repository.readOneById(root._id);
        if (nodeModel) {
            this.logger.info('Trying to read = ' + root._id + ' and returned ' + nodeModel._id);
        } else {
            this.logger.info('Trying to read = ' + root._id + ' and returned undefined');
        }
        let connections: NodeNetworkQualityAssociationClassDataModel[] = [];


        if (root.connections) {
            for (let connection of root.connections) {
                let nodeConnDataModel: NodeNetworkQualityAssociationClassDataModel = {
                    networkQuality: connection.networkQuality,
                    endpoint_id: new ObjectId(connection.connectionEndpoint._id)
                };
                connections.push(nodeConnDataModel);
            }
            nodeModel.connections = connections;

            await this.repository.update(root._id, nodeModel);

            for (let connection of root.connections) {
                await this.saveStructureRelationships(connection.connectionEndpoint);
            }
        }
    }


    private async createStructure(root: Node): Promise<Node> {
        // if (this.visitedNode[root._id]) {
        //     this.logger.info('node already visited');
        //     return root;
        // }
        // this.visitedNode[root._id] = true;

        this.logger.debug(`Creating structure of Node with id = ${root.name}`);

        if (root.connections) {
            for (let connection of root.connections) {
                let peer: Node = connection.connectionEndpoint;
                peer = await this.createStructure(peer);
            }
        }

        return await this.saveNode(root);
    }

    private async saveNode(node: Node): Promise<Node> {

        let bcArtefactsIds: ObjectId[] = [];
        let applicationId: ObjectId = null;

        let blockchainArtefacts: BlockchainArtefact[] = [];

        if (node.blockchainArterfacts) {
            for (let bcArtefacts of node.blockchainArterfacts) {
                bcArtefacts = <BlockchainArtefact> await this.softwareArterfactsService.create(bcArtefacts);
                bcArtefactsIds.push(new ObjectId(bcArtefacts._id));
                blockchainArtefacts.push(bcArtefacts);
            }
        }

        node.blockchainArterfacts = blockchainArtefacts;

        if (node.application) {
            let softArtefact: SoftwareArtefact = await this.softwareArterfactsService.create(node.application);
            applicationId = new ObjectId(softArtefact._id);
            node.application = softArtefact;
        }

        node.container = await this.vmService.create(node.container);

        let nodeDataModel: NodeDataModel = {
            application: applicationId,
            blockchainArterfacts: bcArtefactsIds,
            connections: [],
            container_id: new ObjectId(node.container._id),
            name: node.name,
            nodeType: node.nodeType,
            _id: null
        };

        nodeDataModel = await this.repository.create(nodeDataModel);

        node._id = nodeDataModel._id.toHexString();

        this.logger.info(`Saved node with id = ${node._id}`);

        return node;
    }


    public async readStructure(rootNodeOfStructureId: string): Promise<Node> {

        try {
            this.nodeIdToNodeMap = {};
            return await this.buildStructureOfRoot(rootNodeOfStructureId);
        } catch (e) {
            if (e instanceof PersistenceException) {
                return null;
            } else {
                throw e;
            }
        }
    }


    private async buildStructureOfRoot(rootNodeOfStructureId: string): Promise<Node> {

        let rootDataModel: NodeJoinedDataModel = await this.repository.readOneByIdWithArtefacts(rootNodeOfStructureId);

        if (!rootDataModel) {
            return null;
        }

        if (this.nodeIdToNodeMap[rootNodeOfStructureId]) {
            return this.nodeIdToNodeMap[rootNodeOfStructureId];
        }

        let node: Node = {
            _id: rootDataModel._id.toHexString(),
            nodeType: rootDataModel.nodeType,
            name: rootDataModel.name,
            container: rootDataModel.container,
            blockchainArterfacts: rootDataModel.blockchainArterfacts,
            application: rootDataModel.application,
            connections: []
        };
        this.nodeIdToNodeMap[node._id] = node;

        if (rootDataModel.connections) {
            for (let connectionDataModel of rootDataModel.connections) {
                let endpoint: Node = await this.buildStructureOfRoot(connectionDataModel.endpoint_id.toHexString());
                if (endpoint) {
                    let nodeAssociation: NodeNetworkQualityAssociationClass = {
                        networkQuality: connectionDataModel.networkQuality,
                        connectionEndpoint: endpoint
                    };
                    node.connections.push(nodeAssociation);
                }
            }
        }
        return node;
    }

    public async deleteStructure(rootNodeOfStructureId: string) {

        this.logger.debug(`Removing Node with id = ${rootNodeOfStructureId}`);

        let nodeDataModel: NodeDataModel = null;
        try {
            nodeDataModel = await this.repository.readOneById(rootNodeOfStructureId);
        } catch (e) {

        }

        if (!nodeDataModel) {
            this.logger.debug(`No Node with id = ${rootNodeOfStructureId} found, nothing to remove`);
            return;
        }

        try {
            await this.delete(rootNodeOfStructureId);
        } catch (e) {

        }

        this.logger.info(`Removed Node with id = ${rootNodeOfStructureId}`);

        for (let connection of nodeDataModel.connections) {
            let child_id: string = connection.endpoint_id.toHexString();
            await this.deleteStructure(child_id);
        }
    }

    private async delete(id: string) {
        await this.repository.delete(id);
    }

}