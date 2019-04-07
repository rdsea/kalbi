import {DependencyInjection} from "../../main/DependencyInjection";
import {IContainerConfigurationService, ISoftwareArtefactsService} from "../../main/service/interfaces";
import {MongoClient} from "mongodb";
import {BlockchainArtefact, BlockchainMetadata, SoftwareArtefact} from "../../main/model/dtos";
import {MongoDb} from "../../main/repository/MongoDb";

const assert = require('assert');

describe('SoftwareArtefact tests', () => {


    let dependecnyInjection: DependencyInjection = new DependencyInjection();
    let artefactService: ISoftwareArtefactsService = null;

    before(async () => {
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.createConnection();
        artefactService = dependecnyInjection.createSoftwareArtefactsService();
    });

    after(async () => {
        // close db connection
        await dependecnyInjection.createGraphAPI().closeConnection();
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.closeConnection();
    });

    afterEach(async () => {
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.getDb().dropDatabase();
    });

    it('createArtefactShouldReturnCreatedArtefact', async () => {

        let ethPeerMetada: BlockchainMetadata = {
            implementation: 'ethereum',
            featureName: 'creator'
        };

        let ethPeer: BlockchainArtefact = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };

        let artefact: BlockchainArtefact = <BlockchainArtefact> await artefactService.create(ethPeer);
        let readArtefact: BlockchainArtefact =<BlockchainArtefact> await artefactService.readOne(artefact._id);

        assert(artefact);
        assert(readArtefact);
        assert(artefact._id === readArtefact._id);
        assert(artefact.bcMetadata.featureName === readArtefact.bcMetadata.featureName);
        assert(artefact.bcMetadata.implementation === readArtefact.bcMetadata.implementation);

    });


    it('createArtefactShouldReturnExistingArtefact', async () => {

        let ethPeerMetada: BlockchainMetadata = {
            implementation: 'ethereum',
            featureName: 'creator'
        };

        let ethPeer: BlockchainArtefact = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };

        let ethPeerDuplicate: BlockchainArtefact = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };

        let artefact: BlockchainArtefact = <BlockchainArtefact> await artefactService.create(ethPeer);
        let artefactDuplicate: BlockchainArtefact = <BlockchainArtefact> await artefactService.create(ethPeerDuplicate);

        assert(artefact);
        assert(artefactDuplicate);
        assert(artefact._id === artefactDuplicate._id);
        assert(artefact.bcMetadata.featureName === artefactDuplicate.bcMetadata.featureName);
        assert(artefact.bcMetadata.implementation === artefactDuplicate.bcMetadata.implementation);
    });

    it('readAllArtefactsShouldReturnAll', async () => {

        let ethPeerMetada: BlockchainMetadata = {
            implementation: 'ethereum',
            featureName: 'creator'
        };

        let ethPeer: BlockchainArtefact = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };

        let artefacts: SoftwareArtefact[] = await artefactService.readAll();
        let oldCount: number = artefacts.length;

        for (let i = 0; i < 3; i++) {
            let ethPeer: BlockchainArtefact = {
                _id: null,
                name: 'ethereum peer',
                executionEnvironment: 'docker'+i,
                repositoryTag: 'ethereum/client-go',
                bcMetadata: ethPeerMetada
            };
            await artefactService.create(ethPeer);
        }

        artefacts = await artefactService.readAll();
        assert(artefacts.length == oldCount + 3);
    });

    it('deleteArtefactShouldDeleteArtefact', async () => {

        let ethPeerMetada: BlockchainMetadata = {
            implementation: 'ethereum',
            featureName: 'creator'
        };

        let ethPeer: BlockchainArtefact = {
            _id: null,
            name: 'ethereum peer',
            executionEnvironment: 'docker',
            repositoryTag: 'ethereum/client-go',
            bcMetadata: ethPeerMetada
        };

        let artefact: BlockchainArtefact = <BlockchainArtefact> await artefactService.create(ethPeer);

        let artefacts: SoftwareArtefact[] = await artefactService.readAll();
        let oldCount: number = artefacts.length;

        await artefactService.delete(artefact._id);

        artefact = <BlockchainArtefact>await artefactService.readOne(artefact._id);

        assert(artefact == null);

        artefacts = await artefactService.readAll();

        assert(artefacts);
        assert(artefacts.length + 1 == oldCount);
    });




});