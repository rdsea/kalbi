import {IContainerConfigurationService} from "../../main/service/interfaces";
import {DependencyInjection} from "../../main/DependencyInjection";
import {ContainerConfiguration} from "../../main/model/dtos";
import {MongoClient} from "mongodb";
import {ServiceException} from "../../main/service/ServiceException";
import {expect} from 'chai';
import {MongoDb} from "../../main/repository/MongoDb";


const assert = require('assert');

describe('ContainerConfigurationService tests', () => {


        let dependecnyInjection: DependencyInjection = new DependencyInjection();
        let containerConfigurationService: IContainerConfigurationService = null;


        before(async () => {
            let mongoDb: MongoDb = await dependecnyInjection.createMongoDB();
            await mongoDb.createConnection();
            containerConfigurationService = dependecnyInjection.createContainerConfigurationService();
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


        it('createShouldReturnCreatedContainerConfiguration', async () => {

            let container: ContainerConfiguration = {
                _id: null,
                vCPUcount: 4,
                storageSSD: 20,
                storageHDD: 20,
                provider: 'AWS',
                os: 'ubuntu',
                name: 'medium-machine',
                memory: 16
            };

            let created: ContainerConfiguration = await containerConfigurationService.create(container);
            let readContainer: ContainerConfiguration = await containerConfigurationService.readOne(created._id);

            assert(created);
            assert(readContainer);
            assert(created._id === readContainer._id);

        });


        it('createShouldReturnExistingContainerConfiguration', async () => {

            let containerOriginal: ContainerConfiguration = {
                _id: null,
                vCPUcount: 4,
                storageSSD: 20,
                storageHDD: 20,
                provider: 'AWS',
                os: 'ubuntu',
                name: 'medium-machine',
                memory: 16
            };

            let containerDuplicate: ContainerConfiguration = {
                _id: null,
                vCPUcount: 4,
                storageSSD: 20,
                storageHDD: 20,
                provider: 'AWS',
                os: 'ubuntu',
                name: 'other-machine',
                memory: 16
            };

            let created: ContainerConfiguration = await containerConfigurationService.create(containerOriginal);
            let existing: ContainerConfiguration = await containerConfigurationService.create(containerDuplicate);

            assert(created);
            assert(existing);
            assert(created._id === existing._id);

        });

        it('readOneShouldReturnNothing', async () => {

            let container: ContainerConfiguration = {
                _id: null,
                vCPUcount: 4,
                storageSSD: 20,
                storageHDD: 20,
                provider: 'AWS',
                os: 'ubuntu',
                name: 'medium-machine',
                memory: 16
            };

            container = await containerConfigurationService.create(container);
            await containerConfigurationService.delete(container._id);

            container = await containerConfigurationService.readOne(container._id);
            assert(container == null);
        });

        it('readAllShouldReturnAllContainers', async () => {

            let container: ContainerConfiguration = {
                _id: null,
                vCPUcount: 4,
                storageSSD: 20,
                storageHDD: 20,
                provider: 'AWS',
                os: 'ubuntu',
                name: 'medium-machine',
                memory: 16
            };

            let containers: ContainerConfiguration[] = await containerConfigurationService.readAll();
            assert(containers);
            let oldCount: number = containers.length;

            for (let i = 0; i < 3; i++) {
                container.storageHDD = 20 * i + 5;
                await containerConfigurationService.create(container);
            }

            containers = await containerConfigurationService.readAll();

            assert(oldCount + 3 === containers.length);
        });


        it('deleteContainerShouldDelete', async () => {

            let container: ContainerConfiguration = {
                _id: null,
                vCPUcount: 4,
                storageSSD: 20,
                storageHDD: 20,
                provider: 'GCP',
                os: 'ubuntu',
                name: 'medium-machine',
                memory: 32
            };

            container = await containerConfigurationService.create(container);

            let containers: ContainerConfiguration[] = await containerConfigurationService.readAll();
            let oldCount: number = containers.length;

            await containerConfigurationService.delete(container._id);

            container = await containerConfigurationService.readOne(container._id);
            assert(container == null);

            containers = await containerConfigurationService.readAll();
            assert(oldCount - 1 === containers.length);
        });

        it('deleteContainerShouldThrowServiceException', async () => {

            //using invalid ObjectId here
            try {
                await containerConfigurationService.delete('a');
                assert(false);
            } catch (e) {
                if (e instanceof ServiceException) {
                    assert(true);
                } else {
                    assert(false);
                }
            }

            // expect(containerConfigurationService.delete('a')).to.throw('No ContainerConfiguration has been removed');
        });

    }
);