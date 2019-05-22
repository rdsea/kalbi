import {IDeploymentPatternService} from "./interfaces";
import {IDeploymentPatternGraphRepository} from "../repository/interfaces";
import {Logger} from "log4js";
import {DeploymentPattern, PureNode, Topology, Node, Experiment, NodeType} from "../model/dtos";
import {ServiceException} from "./ServiceException";
import {PersistenceException} from "../repository/PersistenceException";
import {DeploymentPatternValidation} from "../validation/DeploymentPatternValidation";

export class DeploymentPatternService implements IDeploymentPatternService {

    // private visited = {};


    constructor(private repository: IDeploymentPatternGraphRepository,
                private logger: Logger) {

    }

    async create(depPattern: DeploymentPattern): Promise<DeploymentPattern> {

        try {
            DeploymentPatternValidation.validate(depPattern);
            depPattern = await this.repository.create(depPattern);
            this.logger.info(`Created DeploymentPattern with id = ${depPattern._id} in repository`);
            return depPattern;
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('DeploymentPattern hasnt been created');
            } else {
                throw e;
            }
        }
    }

    async createFromExperiment(experiment: Experiment): Promise<DeploymentPattern> {

        try {
            let topology: Topology = experiment.topology;

            // this.visited = {};

            let rootNode: PureNode = this.createPureNodeFromNode(topology.structure);

            let allDepPatterns = await this.readAll();

            this.logger.info('Looking for the DeploymentPattern structure in repository...');

            if (allDepPatterns) {
                for (let depPattern of allDepPatterns) {
                    let patternRootNode: PureNode = depPattern.structure;
                    if (this.equalsPureNodes(rootNode, patternRootNode)) {
                        this.logger.info(`DeploymentPattern structure already exists (id = ${patternRootNode.name}), returning`);
                        return depPattern;
                    }
                }
            }

            this.logger.info('DeploymentPattern not found, its going to be created');

            let name: string = 'deployment pattern';
            if (experiment.depPattern && experiment.depPattern.name) {
                name = experiment.depPattern.name;
            }

            let depPattern: DeploymentPattern = {
                structure: rootNode,
                name: name,
                _id: null
            };

            return await this.create(depPattern);
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('DeploymentPattern hasnt been created');
            } else {
                throw e;
            }
        }

    }

    private equalsPureNodes(nodeA: PureNode, nodeB: PureNode): boolean {

        let nodeAStr: string = this.createStringRepresentationOfTree(nodeA, 0);
        let nodeBStr: string = this.createStringRepresentationOfTree(nodeB, 0);

        return nodeAStr === nodeBStr;
    }

    private createStringRepresentationOfTree(tree: PureNode, level: number): string {

        let anchestorsInString: string[] = [];
        for (let child of tree.peers) {
            let strRepre: string = this.createStringRepresentationOfTree(child, level + 1);
            anchestorsInString.push(strRepre);
        }

        if (anchestorsInString.length == 0) {
            return `${NodeType[tree.nodeType]}${level}`;
        } else {
            anchestorsInString.sort((one, two) => (one > two ? -1 : 1));
            return `${NodeType[tree.nodeType]}${level}-${anchestorsInString.join('-')}`;
        }

    }


    private createPureNodeFromNode(node: Node): PureNode {

        // if (this.visited[node.name]) {
        //     return;
        // }
        // this.visited[node.name] = true;

        let purePeers: PureNode[] = [];

        if (node.connections) {
            for (let connection of node.connections) {
                let peer: Node = connection.connectionEndpoint;

                let purePeer: PureNode = this.createPureNodeFromNode(peer);
                if (purePeer) {
                    purePeers.push(purePeer);
                }
            }
        }

        let id: string = NodeType[node.nodeType] + this.makeid(5);

        let pureNode: PureNode = {
            name: id,
            nodeType: node.nodeType,
            peers: purePeers
        };

        return pureNode;
    }

    private makeid(length) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }



    async readAll(): Promise<DeploymentPattern[]> {
        try {
            return await this.repository.readAll();
        } catch (e) {
            if (e instanceof PersistenceException) {
                return [];
            } else {
                throw e;
            }
        }
    }

    async readOne(id: string): Promise<DeploymentPattern> {
        try {
            return await this.repository.readOneById(id);
        } catch (e) {
            if (e instanceof PersistenceException) {
                return null;
            } else {
                throw e;
            }
        }
    }

    async delete(id: string) {
        try {
            await this.repository.delete(id);
            this.logger.info(`Removed DeploymentPattern with ID = ${id}`);
        } catch (e) {
            if (e instanceof PersistenceException) {
                throw new ServiceException('DeploymentPattern hasnt been deleted');
            } else {
                throw e;
            }
        }
    }
}