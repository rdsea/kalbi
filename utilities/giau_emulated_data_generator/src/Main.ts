import * as log4js from "log4js";
import {Logger} from "log4js";
import {PrecisionRecallEvaluator} from "./PrecisionRecallEvaluator";
import {EmulatedDataGenerator} from "./EmulatedDataGenerator";



export class Main {


    private logger: Logger;


    public async run() {

        this.createLogger();

        let precisionRecall: PrecisionRecallEvaluator = new PrecisionRecallEvaluator(this.logger);
        await precisionRecall.buildConfusionMatrix();

        // let emulatedDataGenerator: EmulatedDataGenerator = new EmulatedDataGenerator(this.logger);
        // await emulatedDataGenerator.generateData();


    }



    private createLogger() {

        if (this.logger) {
            return this.logger;
        }
        log4js.configure('config/log4js.json');
        this.logger = log4js.getLogger('default');
        return this.logger;

    }


}

let main: Main = new Main();
main.run();