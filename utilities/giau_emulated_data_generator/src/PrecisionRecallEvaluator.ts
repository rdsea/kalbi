import {Logger} from "log4js";
import {PureNode, Node, NodeType, Experiment, Topology} from "./types";
import * as fs from "fs";
import * as request from "request";
import * as random from 'random';


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


    public async buildConfusionMatrix() {

        let filenames: string[] = fs.readdirSync('emulated_data');

        let confusionMatrix: number[][] = new Array(10).fill(0).map(() => new Array(10).fill(0));

        for (let i = 0; i < filenames.length; i++) {

            let content: string = filenames[i];

            let contentString: string = fs.readFileSync('emulated_data/' + content).toString();
            let experiment: Experiment = JSON.parse(contentString);

            let pureTree: PureNode = this.createPureNodeFromNode(experiment.topology.structure);

            this.cutTreeFromLevel(1, pureTree);

            // check whether the "cut" trees represented by pureNode have been correctly predicted
            await this.determinePredictedTopology(pureTree, i, confusionMatrix);

            for (let n = 0; n < 4; n++) {
                let actualPureNodeCopy: PureNode = JSON.parse(JSON.stringify(pureTree).toString());
                // append 3 random nodes to the cut tree
                this.appendRandomNodesToPureNode(actualPureNodeCopy, 3);
                // should be correctly predicted to the i-th topology
                await this.determinePredictedTopology(actualPureNodeCopy, i, confusionMatrix);
            }
        }


        this.logger.info("CONFUSION MATRIX:");

        for (let i = 0; i < confusionMatrix.length; i++) {
            let row: string = '';
            for (let j = 0; j < confusionMatrix[i].length; j++) {
                row = row + confusionMatrix[i][j] + ' ';
            }
            this.logger.info(row);
        }
    }


    private async determinePredictedTopology(actualPureNode: PureNode, actualPureNodeIndex: number, confusionMatrix: number[][]) {

        let filenames: string[] = fs.readdirSync('emulated_data');

        let predictedTopology: Topology = await this.obtainRecommendedTopology(actualPureNode);

        for (let j = 0; j < filenames.length; j++) {
            let actual: string = filenames[j];
            let actualString: string = fs.readFileSync('emulated_data/' + actual).toString();
            let actualExperiment: Experiment = JSON.parse(actualString);

            if (actualExperiment.topology.caption == predictedTopology.caption) { // we can use caption as identifier here (see EmulatedDataGenerator to see how it's generated)
                confusionMatrix[actualPureNodeIndex][j]++;
            }
        }

    }


    private appendRandomNodesToPureNode(pureNode: PureNode, nodesToAppend: number) {

        if (nodesToAppend == 0) {
            return;
        }

        for (let childNode of pureNode.peers) {
            if (this.generateRandomNr(0, 4) == 0) {
                let pureNodeType: NodeType = this.generateRandomNodeType();
                let pureNode: PureNode = {
                    peers: [],
                    nodeType: pureNodeType,
                    name: NodeType[pureNodeType] + '-' + this.makeid(5)
                };
                childNode.peers.push(pureNode);
                this.appendRandomNodesToPureNode(childNode, nodesToAppend - 1);
            } else {
                this.appendRandomNodesToPureNode(childNode, nodesToAppend);
            }
        }
    }

    private cutTreeFromLevel(level: number, pureNode: PureNode) {
        if (level == 0) {
            pureNode.peers = [];
        }
        for (let peer of pureNode.peers) {
            this.cutTreeFromLevel(level - 1, peer);
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


        return new Promise<any>((resolve, reject) => {
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

    public generateRandomNodeType(): NodeType {
        let random: number = this.normalRandomInteger(2, 1);

        if (random == 2) {
            return NodeType.vehicle;
        } else if (random == 3) {
            return NodeType.edge;
        } else if (random == 1 || random == 4) {
            return NodeType.rsu;
        } else {
            return NodeType.cloud;
        }
    }

    public normalRandomInteger(mu: number, sigma: number) {
        let randomFcn = random.normal(mu, sigma);
        let randNr: number = randomFcn();
        if (randNr < 1) {
            return 1;
        }
        return Math.floor(randNr);
    }


    public generateRandomNr(min: number, max: number): number {
        if (min == max) {
            return min;
        }

        /**
         * FROM: https://stackoverflow.com/a/1527820/2205582
         * Returns a random integer between min (inclusive) and max (inclusive).
         * The value is no lower than min (or the next integer greater than min
         * if min isn't an integer) and no greater than max (or the next integer
         * lower than max if max isn't an integer).
         * Using Math.round() will give you a non-uniform distribution!
         */
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
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