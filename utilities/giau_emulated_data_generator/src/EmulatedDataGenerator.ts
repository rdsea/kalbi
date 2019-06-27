import {Logger} from "log4js";
import {
    Benchmark,
    BlockchainArtefact,
    ContainerConfiguration,
    DataExchangeAnalysis,
    Experiment,
    HardwareUtilization,
    Node,
    NodeNetworkQualityAssociationClass,
    NodeRef,
    ResourceType,
    SynchronisationState,
    Topology,
    TransactionResult
} from "./types";
import * as fs from "fs";
import * as random from 'random';


export class EmulatedDataGenerator {

    private impl: string;

    constructor(private logger: Logger) {

    }

    public generateData(topologyCount: number, benchmarksResultCount: number) {

        let expId: number = 0;

        for (let i = 0; i < topologyCount; i++) {
            let emulatedTopology: Topology = this.generateTopology();

            if (i == 0) {
                this.impl = 'ethereum';
            }
            if (i == Math.floor(topologyCount / 3)) {
                this.impl = 'hyperledger-fabric';
            }
            if (i == Math.floor(topologyCount / 3 * 2)) {
                this.impl = 'eosio';
            }


            for (let j = 0; j < benchmarksResultCount; j++) {

                let emulatedBenchmark: Benchmark = this.generateBenchmarkResults(emulatedTopology);

                let experiment: Experiment = {
                    _id: null,
                    topology: emulatedTopology,
                    benchmark: emulatedBenchmark,
                    depPattern: null
                };

                // writing experiment to file
                this.logger.info("Writing benchmarks-"+expId)
                fs.writeFileSync('../../giau/tests/data/emulated_data/performance-eval/benchmarks-' + expId, JSON.stringify(experiment, null, 4));
                expId++;
            }
        }
    }


    private generateTopology(): Topology {

        this.logger.info("Generating emulated topology");

        let topologySize: number = this.normalRandomInteger(100, 30);

        let randomNodesPool: Node[] = [];
        while (topologySize-- > 0) {
            randomNodesPool.push(this.generateRandomNode());
        }

        let topologyStructure: Node = this.generateRandomTree(randomNodesPool);

        let topology: Topology = {
            structure: topologyStructure,
            specification: null,
            specificationLang: null,
            _id: null,
            caption: 'topology with root -' + topologyStructure.name
        };

        return topology;
    }

    private allNodes: Node[];

    private obtainNodesFromTopology(node: Node) {

        this.allNodes.push(node);

        if (node.connections) {
            for (let peer of node.connections) {
                this.obtainNodesFromTopology(peer.connectionEndpoint);
            }
        }
    }

    private generateBenchmarkResults(topology: Topology): Benchmark {

        this.allNodes = [];
        this.obtainNodesFromTopology(topology.structure);

        this.logger.info("Generating emulated benchmark result");

        let benchmark: Benchmark = {
            qualityAttributes: [],
            _id: null
        };

        for (let node of this.allNodes) {
            /**
             * Transaction analysis wrapper
             */
            let txResults: TransactionResult[] = [];

            let transactionsCount: number = this.normalRandomInteger(100, 30);
            let acceptedCount: number = 0;
            for (let i = 0; i < transactionsCount; i++) {
                let isAccepted: boolean = this.normalRandomInteger(2, 1) == 3 ? false : true;
                let txResult: TransactionResult = null;
                if (isAccepted) {
                    acceptedCount++;
                    txResult = {
                        data: {
                            creationTime: this.normalRandomInteger(100, 30),
                            acceptationTime: this.normalRandomInteger(4000, 1000),
                            payloadData: null
                        },
                        errorMsg: null
                    };
                } else {
                    txResult = {
                        data: null,
                        errorMsg: 'Transaction wasnt accepted'
                    };
                }
                txResults.push(txResult);
            }

            let dataExchangeAnalysis: DataExchangeAnalysis = {
                _id: null,
                description: 'analysis of transactions operations',
                name: 'Data exchange analysis',
                txResults: txResults,
                failedTxCount: transactionsCount - acceptedCount,
                acceptedTxCount: acceptedCount,
                nodeRef: {
                    name: node.name
                }
            };

            benchmark.qualityAttributes.push(dataExchangeAnalysis);

            /**
             * Hardware utilization
             */
            let hardwareUtilization: HardwareUtilization = {
                _id: null,
                name: 'Hardware utilization of ' + node.name,
                description: '',
                nodeRef: {
                    name: node.name
                },
                cpuUtil: this.normalRandomInteger(70, 10),
                memoryUtil: this.normalRandomInteger(4000, 1000)
            };

            benchmark.qualityAttributes.push(hardwareUtilization);

        }

        /**
         * Synchronization State
         */
        let nonSyncStateNodesCount: number = Math.floor(this.allNodes.length * 0.2);
        nonSyncStateNodesCount = this.generateRandomNr(0, nonSyncStateNodesCount);

        let outOfSyncNodes: NodeRef[] = [];

        for (let i: number = 0; i < nonSyncStateNodesCount; i++) {
            outOfSyncNodes.push({
                name: this.allNodes[i].name
            });
        }

        let syncState: SynchronisationState = {
            nodesOutOfSync: outOfSyncNodes,
            description: '',
            _id: null,
            name: ''
        };

        benchmark.qualityAttributes.push(syncState);
        return benchmark;
    }

    private generateRandomTree(nodes: Node[]): Node {

        let rootNode: Node = nodes[0];
        nodes.splice(0, 1);

        while (nodes.length > 0) {

            let childrenCount: number = this.generateRandomNr(1, nodes.length - 1);

            let childrenNodes: Node[] = nodes.splice(0, childrenCount);
            let subtree: Node = this.generateRandomTree(childrenNodes);

            let nodeAssociationClass: NodeNetworkQualityAssociationClass = {
                networkQuality: {
                    bandwidth: this.normalRandomInteger(1000, 100).toString(),
                    latency: this.normalRandomInteger(100, 10).toString(),
                    name: 'network quality'
                },
                connectionEndpoint: subtree
            };

            if (!rootNode.connections) {
                rootNode.connections = [];
            }
            rootNode.connections.push(nodeAssociationClass);
        }
        return rootNode;
    }

    private generateRandomNode(): Node {

        let node: Node = {
            connections: null, // will be added by generateRandomTree
            application: null,
            container: this.generateNormalRandomMachineConfiguration(),
            resourceType: this.generateRandomNodeType(),
            _id: null,
            name: this.makeid(7),
            blockchainArterfacts: [this.generateBlockchainArtefact(this.impl)]
        };

        return node;
    }

    private generateBlockchainArtefact(implementation: string): BlockchainArtefact {
        let featureName: string[] = ['creator', 'miner'];
        let index: number = this.generateRandomNr(0, 1);

        let blockchainArtefact: BlockchainArtefact = {
            bcMetadata: {
                featureName: featureName[index],
                implementation: implementation
            },
            _id: null,
            repositoryTag: 'someid',
            executionEnvironment: 'docker',
            name: `${implementation}-${featureName[index]}`
        };

        return blockchainArtefact;
    }

    private generateNormalRandomMachineConfiguration(): ContainerConfiguration {

        let storageHDD: number = this.normalRandomInteger(25, 5);
        let storageSSD: number = this.normalRandomInteger(25, 5);

        let memory: number = this.normalRandomInteger(8, 4);

        let vCPUCount: number = this.normalRandomInteger(4, 2);

        let machineConfig: ContainerConfiguration = {
            _id: null,
            name: `vm-${vCPUCount}-${memory}-${storageSSD}-${storageHDD}`,
            provider: 'AWS',
            os: 'Ubuntu 18.04',
            storageHDD: storageHDD,
            storageSSD: storageSSD,
            memory: memory,
            vCPUcount: vCPUCount
        };
        return machineConfig;
    }

    private generateRandomNodeType(): ResourceType {

        let randomFcn = random.normal(2, 1);
        let randNr: number = randomFcn();

        if (randNr < 1) {
            return ResourceType.EDGE_SERVICE;
        } else if (randNr >= 1 && randNr < 2.5) {
            return ResourceType.VEHICLE_IOT;
        } else if (randNr >= 2.5 && randNr < 3.5) {
            return ResourceType.RSU_RESOURCE;
        } else {
            return ResourceType.CLOUD_SERVICE;
        }
    }

    private normalRandomInteger(mu: number, sigma: number) {
        let randomFcn = random.normal(mu, sigma);
        let randNr: number = randomFcn();
        if (randNr < 1) {
            return 1;
        }
        return Math.floor(randNr);
    }

    private generateRandomNr(min: number, max: number): number {
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