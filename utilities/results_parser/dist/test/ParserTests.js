"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DataModelParser_1 = require("../main/parser/DataModelParser");
const log4js = require("log4js");
const assert = require('assert');
describe('DataModelParser tests', () => {
    let logger = createLogger();
    let dataModelParser = new DataModelParser_1.DataModelParser(logger);
    it('createShouldParseContainerConfiguration', () => __awaiter(this, void 0, void 0, function* () {
        let bfContainer = {
            provider: 'Google Cloud Platform',
            memory: 2,
            os: 'ubuntu',
            storageHDD: 20,
            storageSSD: 20,
            vCPUcount: 2,
            name: 'small-machine'
        };
        let container = dataModelParser.parseContainer(bfContainer);
        assert(bfContainer.name == container.name);
        assert(bfContainer.provider == container.provider);
        assert(bfContainer.memory == container.memory);
        assert(bfContainer.os == container.os);
        assert(bfContainer.storageSSD == container.storageSSD);
        assert(bfContainer.storageHDD == container.storageHDD);
        assert(bfContainer.vCPUcount == container.vCPUcount);
    }));
    function createLogger() {
        log4js.configure('config/log4js.json');
        return log4js.getLogger('default');
    }
});
