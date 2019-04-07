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
const OperationAnalyser_1 = require("../analyser/OperationAnalyser");
class DrivingDataProducer {
    constructor(vehicleDAO, v2xPaas, logger) {
        this.vehicleDAO = vehicleDAO;
        this.v2xPaas = v2xPaas;
        this.logger = logger;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Initializing data producer of Vehicle${this.v2xPaas.getVehicleId()}`);
            yield this.sleep(10000);
            this.logger.info('Inserting new vehicle...');
            let vehicleId = this.v2xPaas.getVehicleId();
            try {
                yield this.insertVehicleWithRetry({ id: vehicleId, velocity: 60, acceleration: 4 }, 5);
            }
            catch (e) {
                this.logger.info(`Error when inserting vehicles ${e}`);
            }
            try {
                let car = yield this.vehicleDAO.get(vehicleId);
                this.logger.info('>>> vehicle' + vehicleId + ' = ' + JSON.stringify(car, null, 4));
                this.logger.info('====== Blocks filled with data ======');
            }
            catch (e) {
            }
            this.initialized = true;
        });
    }
    insertVehicleWithRetry(vehicle, retryNr) {
        return __awaiter(this, void 0, void 0, function* () {
            while (retryNr >= 0) {
                try {
                    yield this.vehicleDAO.insert(vehicle);
                    break;
                }
                catch (e) {
                    if (retryNr == 0) {
                        throw `Vehicle wasn't inserted after ${retryNr} retries ... ${e}`;
                    }
                    retryNr--;
                    this.logger.info('>>> Failed to insert vehicle, retrying.... Error = ' + e);
                }
            }
        });
    }
    run(roundsNr) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`=== Vehicle${this.v2xPaas.getVehicleId()} started producing data ===`);
            if (!this.initialized) {
                throw ("Run initialized() as first.");
            }
            this.operationAnalyser = new OperationAnalyser_1.OperationAnalyser(this.vehicleDAO, this.v2xPaas, this.logger);
            yield this.operationAnalyser.runUpdateVelocityAnalysis(roundsNr);
        });
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.DrivingDataProducer = DrivingDataProducer;
