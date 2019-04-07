import {DataModelParser} from "../main/parser/DataModelParser";
import {Logger} from "log4js";
import * as log4js from "log4js";
import {BFContainerConfiguration} from "../main/parser/benchmark_types";
import {ContainerConfiguration} from "../main/parser/experiments_knowledge_service_types";

const assert = require('assert');

describe('DataModelParser tests', () => {

    let logger: Logger = createLogger();
    let dataModelParser: DataModelParser = new DataModelParser(logger);

    it('createShouldParseContainerConfiguration', async () => {

        let bfContainer: BFContainerConfiguration = {
            provider: 'Google Cloud Platform',
            memory: 2,
            os: 'ubuntu',
            storageHDD: 20,
            storageSSD: 20,
            vCPUcount: 2,
            name: 'small-machine'
        };

        let container: ContainerConfiguration = dataModelParser.parseContainer(bfContainer);

        assert(bfContainer.name == container.name);
        assert(bfContainer.provider == container.provider);
        assert(bfContainer.memory == container.memory);
        assert(bfContainer.os == container.os);
        assert(bfContainer.storageSSD == container.storageSSD);
        assert(bfContainer.storageHDD == container.storageHDD);
        assert(bfContainer.vCPUcount == container.vCPUcount);

    });

    function createLogger(): Logger {
        log4js.configure('config/log4js.json');
        return log4js.getLogger('default');
    }

});