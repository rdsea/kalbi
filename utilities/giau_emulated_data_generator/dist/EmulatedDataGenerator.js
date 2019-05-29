"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const fs = require("fs");
const random = require("random");
class EmulatedDataGenerator {
    constructor(logger) {
        this.logger = logger;
    }
    generateData() {
        let BENCHMARKS_COUNT = 250;
        for (let i = 0; i < BENCHMARKS_COUNT; i++) {
            if (i == 0) {
                this.impl = 'ethereum';
            }
            this.generateBenchmarkedExperiment(i);
            if (i == Math.floor(BENCHMARKS_COUNT / 3)) {
                this.impl = 'hyperledger-fabric';
            }
            if (i == Math.floor(BENCHMARKS_COUNT / 3 * 2)) {
                this.impl = 'eosio';
            }
        }
    }
    generateBenchmarkedExperiment(expId) {
        this.logger.info("Generating emulated benchmark " + expId);
        let topologySize = this.normalRandomInteger(100, 30);
        let randomNodesPool = [];
        let randomNodesPoolCopy = [];
        while (topologySize-- > 0) {
            randomNodesPool.push(this.generateRandomNode());
            randomNodesPoolCopy.push(randomNodesPool[randomNodesPool.length - 1]);
        }
        let topologyStructure = this.generateRandomTree(randomNodesPoolCopy);
        let topology = {
            structure: topologyStructure,
            specification: null,
            specificationLang: null,
            _id: null,
            caption: 'topology with root -' + topologyStructure.name
        };
        let benchmark = {
            qualityAttributes: [],
            _id: null
        };
        for (let node of randomNodesPool) {
            /**
             * Transaction analysis wrapper
             */
            let txResults = [];
            let transactionsCount = this.normalRandomInteger(100, 30);
            let acceptedCount = 0;
            for (let i = 0; i < transactionsCount; i++) {
                let isAccepted = this.normalRandomInteger(2, 1) == 3 ? false : true;
                let txResult = null;
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
                }
                else {
                    txResult = {
                        data: null,
                        errorMsg: 'Transaction wasnt accepted'
                    };
                }
                txResults.push(txResult);
            }
            let dataExchangeAnalysis = {
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
            let hardwareUtilization = {
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
        let nonSyncStateNodesCount = Math.floor(randomNodesPool.length * 0.2);
        nonSyncStateNodesCount = this.generateRandomNr(0, nonSyncStateNodesCount);
        let outOfSyncNodes = [];
        for (let i = 0; i < nonSyncStateNodesCount; i++) {
            outOfSyncNodes.push({
                name: randomNodesPool[i].name
            });
        }
        let syncState = {
            nodesOutOfSync: outOfSyncNodes,
            description: '',
            _id: null,
            name: ''
        };
        benchmark.qualityAttributes.push(syncState);
        let experiment = {
            _id: null,
            topology: topology,
            benchmark: benchmark,
            depPattern: null
        };
        // writing experiment to file
        fs.writeFileSync('emulated_data/benchmarks-' + expId, JSON.stringify(experiment, null, 4));
    }
    generateRandomTree(nodes) {
        let rootNode = nodes[0];
        nodes.splice(0, 1);
        while (nodes.length > 0) {
            let childrenCount = this.generateRandomNr(1, nodes.length - 1);
            let childrenNodes = nodes.splice(0, childrenCount);
            let subtree = this.generateRandomTree(childrenNodes);
            let nodeAssociationClass = {
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
    generateRandomNode() {
        let node = {
            connections: null,
            application: null,
            container: this.generateNormalRandomMachineConfiguration(),
            nodeType: this.generateRandomNodeType(),
            _id: null,
            name: this.makeid(7),
            blockchainArterfacts: [this.generateBlockchainArtefact(this.impl)]
        };
        return node;
    }
    generateBlockchainArtefact(implementation) {
        let featureName = ['creator', 'miner'];
        let index = this.generateRandomNr(0, 1);
        let blockchainArtefact = {
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
    generateNormalRandomMachineConfiguration() {
        let storageHDD = this.normalRandomInteger(25, 5);
        let storageSSD = this.normalRandomInteger(25, 5);
        let memory = this.normalRandomInteger(8, 4);
        let vCPUCount = this.normalRandomInteger(4, 2);
        let machineConfig = {
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
    generateRandomNodeType() {
        let randomFcn = random.normal(2, 1);
        let randNr = randomFcn();
        if (randNr < 1) {
            return types_1.NodeType.edge;
        }
        else if (randNr >= 1 && randNr < 2.5) {
            return types_1.NodeType.vehicle;
        }
        else if (randNr >= 2.5 && randNr < 3.5) {
            return types_1.NodeType.rsu;
        }
        else {
            return types_1.NodeType.cloud;
        }
    }
    normalRandomInteger(mu, sigma) {
        let randomFcn = random.normal(mu, sigma);
        let randNr = randomFcn();
        if (randNr < 1) {
            return 1;
        }
        return Math.floor(randNr);
    }
    generateRandomNr(min, max) {
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
    makeid(length) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
exports.EmulatedDataGenerator = EmulatedDataGenerator;
//# sourceMappingURL=EmulatedDataGenerator.js.map