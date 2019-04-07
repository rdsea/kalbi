import {BlockchainArtefact, BlockchainMetadata, NetworkQuality, ContainerConfiguration} from "../parser/experiments_knowledge_service_types";


export class InfrastructureAndArtefactsCreator {

    constructor() {
    }


    public createBlockchainArtefactEthereum(): BlockchainArtefact[] {


        let ethPeerMetada: BlockchainMetadata = {
            implementation: 'ethereum',
            featureName: 'creator'
        };

        let ethMinerMetadata: BlockchainMetadata = {
            implementation: 'ethereum',
            featureName: 'miner'
        };

        let ethPeer: BlockchainArtefact = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };

        let ethMiner: BlockchainArtefact = {
            _id: null,
            name: 'ethereum miner',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethMinerMetadata
        };

        return [ethPeer, ethMiner];
    }

    public createBlockchainArtefactHypFab(): BlockchainArtefact[] {

        let hypfabPeerMetada: BlockchainMetadata = {
            implementation: 'hyperledger-fabric',
            featureName: 'creator'
        };

        let hypfabMinerMetadata: BlockchainMetadata = {
            implementation: 'hyperledger-fabric',
            featureName: 'miner'
        };

        let hypfabPeer: BlockchainArtefact = {
            _id: null,
            name: 'hypfab peer',
            executionEnvironment: 'docker',
            repositoryTag: 'hyperledger/fabric-peer',
            bcMetadata: hypfabPeerMetada
        };

        let hypfabMiner: BlockchainArtefact = {
            _id: null,
            name: 'hypfab miner',
            executionEnvironment: 'docker',
            repositoryTag: 'hyperledger/fabric-orderer',
            bcMetadata: hypfabMinerMetadata
        };

        let hypfabKafka: BlockchainArtefact = {
            _id: null,
            name: 'hypfab kafka',
            executionEnvironment: 'docker',
            repositoryTag: 'hyperledger/fabric-kafka',
            bcMetadata: {
                implementation: 'hyperledger',
                featureName: 'kafka'
            }
        };

        let hypfabZookeeper: BlockchainArtefact = {
            _id: null,
            name: 'hypfab zookeeper',
            executionEnvironment: 'docker',
            repositoryTag: 'hyperledger/fabric-zookeeper',
            bcMetadata: {
                featureName: 'zookeeper',
                implementation: 'hyperledger'
            }
        };

        let hypfabFabricCA: BlockchainArtefact = {
            _id: null,
            name: 'hypfab fabric-ca',
            executionEnvironment: 'docker',
            repositoryTag: 'hyperledger/fabric-ca',
            bcMetadata: {
                implementation: 'hyperledger',
                featureName: 'certificate authority'
            }
        };

        let hypfabFabricTools: BlockchainArtefact = {
            _id: null,
            name: 'hypfab fabric-tools',
            executionEnvironment: 'docker',
            repositoryTag: 'hyperledger/fabric-tools',
            bcMetadata: {
                featureName: 'tools',
                implementation: 'hyperledger'
            }
        };

        return [hypfabPeer, hypfabMiner, hypfabKafka, hypfabZookeeper, hypfabFabricCA, hypfabFabricTools];
    }

}