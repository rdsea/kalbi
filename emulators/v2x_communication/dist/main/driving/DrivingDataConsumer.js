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
class DrivingDataConsumer {
    constructor(vehiclesDAO, v2xPaas, logger) {
        this.vehiclesDAO = vehiclesDAO;
        this.v2xPaas = v2xPaas;
        this.logger = logger;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO solve how to use consumer
            this.logger.info('=== Vehicle2 started consuming data ===');
            let lastCar = null;
            while (true) {
                let car = yield this.vehiclesDAO.get(this.v2xPaas.getVehicleId());
                if (!this.equalsVehicles(car, lastCar)) {
                    this.logger.info('=== Driving data changed! ===');
                    lastCar = car;
                    let time = new Date().getTime();
                    this.logger.info('>>> Driving data ' + JSON.stringify(lastCar, null, 4) + ' retrieved at ' + time);
                }
                yield this.sleep(30);
            }
        });
    }
    equalsVehicles(v1, v2) {
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
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.DrivingDataConsumer = DrivingDataConsumer;
