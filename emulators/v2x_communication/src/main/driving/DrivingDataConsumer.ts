import {V2XPaaS} from "./V2XPaaS";
import {Logger} from "log4js";


export class DrivingDataConsumer implements IDrivingDataConsumer {

    constructor(private vehiclesDAO: IDrivingDataDAO,
                private v2xPaas: V2XPaaS,
                private logger: Logger) {

    }


    async run() {

        //TODO solve how to use consumer
        this.logger.info('=== Vehicle2 started consuming data ===');

        let lastCar: DrivingData = null;

        while (true) {

            let car: DrivingData = await this.vehiclesDAO.get(this.v2xPaas.getVehicleId());

            if (!this.equalsVehicles(car, lastCar)) {

                this.logger.info('=== Driving data changed! ===');

                lastCar = car;
                let time = new Date().getTime();
                this.logger.info('>>> Driving data ' + JSON.stringify(lastCar, null, 4) + ' retrieved at ' + time);
            }

            await this.sleep(30);
        }
    }


    private equalsVehicles(v1: DrivingData, v2: DrivingData): boolean {

        if (v1 && v2) {

            return v1.id == v2.id &&
                v1.velocity.toString() == v2.velocity.toString() &&
                v1.acceleration.toString() == v2.acceleration.toString();
        }

        else if (!v1 && !v2) {
            return true;
        }
        return false;
    }

    private async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}