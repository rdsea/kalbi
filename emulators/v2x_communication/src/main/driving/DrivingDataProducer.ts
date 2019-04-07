import {V2XPaaS} from "./V2XPaaS";
import {OperationAnalyser} from "../analyser/OperationAnalyser";
import {Logger} from "log4js";


export class DrivingDataProducer implements IDrivingDataProducer {

    private initialized: boolean;
    private operationAnalyser: OperationAnalyser;

    constructor(private vehicleDAO: IDrivingDataDAO,
                private v2xPaas: V2XPaaS,
                private logger: Logger) {
    }

    async initialize() {

        this.logger.info(`Initializing data producer of Vehicle${this.v2xPaas.getVehicleId()}`);

        await this.sleep(10000);

        this.logger.info('Inserting new vehicle...');

        let vehicleId = this.v2xPaas.getVehicleId();

        try {
            await this.insertVehicleWithRetry({id: vehicleId, velocity: 60, acceleration: 4}, 5);
        } catch (e) {
            this.logger.info(`Error when inserting vehicles ${e}`);
        }

        try {
            let car = await this.vehicleDAO.get(vehicleId);
            this.logger.info('>>> vehicle' + vehicleId + ' = ' + JSON.stringify(car, null, 4));

            this.logger.info('====== Blocks filled with data ======');
        } catch (e) {

        }

        this.initialized = true;
    }

    private async insertVehicleWithRetry(vehicle: DrivingData, retryNr: number) {

        while (retryNr >= 0) {
            try {
                await this.vehicleDAO.insert(vehicle);
                break;
            } catch (e) {
                if (retryNr == 0) {
                    throw `Vehicle wasn't inserted after ${retryNr} retries ... ${e}`;
                }
                retryNr--;

                this.logger.info('>>> Failed to insert vehicle, retrying.... Error = ' + e);
            }
        }
    }

    async run(roundsNr: number) {

        this.logger.info(`=== Vehicle${this.v2xPaas.getVehicleId()} started producing data ===`);

        if (!this.initialized) {
            throw ("Run initialized() as first.");
        }

        this.operationAnalyser = new OperationAnalyser(this.vehicleDAO, this.v2xPaas, this.logger);
        await this.operationAnalyser.runUpdateVelocityAnalysis(roundsNr);
    }

    private async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}