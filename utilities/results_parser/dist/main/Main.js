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
const log4js = require("log4js");
const DataModelParser_1 = require("./parser/DataModelParser");
class Main {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let logger = this.createLogger();
            let parser = new DataModelParser_1.DataModelParser(logger);
            if (process.argv.length == 4) {
                let inputFilePath = process.argv[2];
                let outputFilePath = process.argv[3];
                parser.parseAndStoreExperimentAtPath(inputFilePath, outputFilePath);
            }
            else {
                logger.error('Usage: \'npm run start inputFilePath.json\' \'outputFilePath.json\' ');
            }
        });
    }
    createLogger() {
        log4js.configure('config/log4js.json');
        return log4js.getLogger('default');
    }
}
let main = new Main();
main.run();
