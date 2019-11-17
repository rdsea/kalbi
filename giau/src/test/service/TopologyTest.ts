import {DependencyInjection} from "../../main/DependencyInjection";
import {
    INodeStructureService,
    ITopologyService
} from "../../main/service/interfaces";
import {Node, Topology} from "../../main/model/dtos";
import {createStructureForInteraction4Large} from "./NodeStructureTest";
import {MongoDb} from "../../main/repository/MongoDb";

const assert = require('assert');


describe('Topology tests', () => {


    let dependecnyInjection: DependencyInjection = new DependencyInjection();
    let nodeStructureService: INodeStructureService = null;
    let topologyService: ITopologyService = null;

    before(async () => {
        let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
        await mongoDb.createConnection();
        nodeStructureService = dependecnyInjection.createNodeStructureService();
        topologyService = dependecnyInjection.createTopologyService();
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

    it('createShouldReturnCreatedTopology', async () => {

        let topology: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };

        topology = await topologyService.create(topology);
        let structure: Node = await nodeStructureService.readStructure(topology.structure._id);

        assert(topology);
        assert(topology._id);
        assert(structure);
        assert(structure._id == topology.structure._id);

        let topologyRead: Topology = await topologyService.readOne(topology._id);

        assert(topology._id == topologyRead._id);
    });

    it('deleteShouldDeleteTopology', async () => {

        let topology: Topology = {
            _id: null,
            caption: 'bla',
            specification: 'docker-compose',
            specificationLang: '...',
            structure: createStructureForInteraction4Large()
        };
        topology = await topologyService.create(topology);
        await topologyService.delete(topology._id);

        let structure: Node = await nodeStructureService.readStructure(topology.structure._id);

        // underlying structure is deleted
        assert(structure == null);
    });

});