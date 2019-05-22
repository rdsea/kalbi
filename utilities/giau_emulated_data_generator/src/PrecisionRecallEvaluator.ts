import {Logger} from "log4js";
import {PureNode, Node, NodeType, Experiment, Topology} from "./types";
import * as fs from "fs";
import * as request from "request";


export class PrecisionRecallEvaluator {


    constructor(private logger: Logger) {

    }

    public async runTesting() {

        let filenames: string[] = fs.readdirSync('emulated_data');

        for (let i = 0; i < filenames.length; i++) {

            let content: string = filenames[i];

            this.logger.info(`Reading PureNode from emulated_data/${content}`);

            let contentString: string = fs.readFileSync('emulated_data/' + content).toString();
            let experiment: Experiment = JSON.parse(contentString);

            this.logger.info(`Loaded topology with id = ${experiment.topology.caption}`);

            let pureTree: PureNode = this.createPureNodeFromNode(experiment.topology.structure);

            this.logger.info(`Obtaining recommendation based on the read PureNode...`);

            let recommendedTopology: Topology = await this.obtainRecommendedTopology(pureTree);
            let recommendedPureNode: PureNode = this.createPureNodeFromNode(recommendedTopology.structure);

            this.logger.info(`Topology ${recommendedTopology.caption} has been returned by GIAU`);

            let equals: boolean = this.equalsPureNodes(pureTree, recommendedPureNode);

            if (equals) {
                this.logger.info('OK!');
            } else {
                this.logger.info('NOT MATCHED!');
            }

        }


    }

    private async obtainRecommendedTopology(pureNode: PureNode): Promise<Topology> {

        let options = {
            method: 'POST',
            url: `http://localhost:9000/api/v1/recommendTopology?syncPrior=5&txAcceptRate=4&txAcceptTime=3&infRes=2`,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: pureNode,
            json: true
        };


        return new Promise<any>( (resolve, reject) =>  {
            request.post(options, (error, response, body) => {
                if (error) {
                    reject('Topology cannot be recommended due to following error: ' + error);
                }
                if (response) {
                    resolve(response.body);
                }
            });
        });
    }

    private createPureNodeFromNode(node: Node): PureNode {

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

    private makeid(length) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }


}