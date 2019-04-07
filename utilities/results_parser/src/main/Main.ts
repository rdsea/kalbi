import {Logger} from "log4js";
import * as log4js from "log4js";
import {DataModelParser} from "./parser/DataModelParser";

class Main {

    async run() {
        let logger: Logger = this.createLogger();

        let parser: DataModelParser = new DataModelParser(logger);

        if (process.argv.length == 4) {

            let inputFilePath: string = process.argv[2];
            let outputFilePath: string = process.argv[3];

            parser.parseAndStoreExperimentAtPath(inputFilePath, outputFilePath);

        } else {
            logger.error('Usage: \'npm run start inputFilePath.json\' \'outputFilePath.json\' ');
        }

    }

    public createLogger(): Logger {
        log4js.configure('config/log4js.json');
        return log4js.getLogger('default');
    }
}

let main: Main = new Main();
main.run();

