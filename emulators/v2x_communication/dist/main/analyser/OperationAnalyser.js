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
const fs = require("fs");
class OperationAnalyser {
    constructor(vehiclesDAO, v2xPaas, logger) {
        this.vehiclesDAO = vehiclesDAO;
        this.v2xPaas = v2xPaas;
        this.logger = logger;
    }
    runUpdateVelocityAnalysis(rounds) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodeRef = {
                name: this.v2xPaas.getVehicleId()
            };
            let simulation = {
                name: 'data exchange analysis',
                description: 'analysis of messages from ' + nodeRef.name,
                acceptedTxCount: 0,
                failedTxCount: 0,
                txResults: [],
                nodeRef: nodeRef
            };
            this.logger.info('Starting update velocity operation analysis...');
            this.logger.info(`Rounds number = ${rounds}`);
            let createTxTotalTime = 0;
            let acceptTxTotalTime = 0;
            let acceptTxTimesArray = [];
            let successfullyCommittedTxCount = 0;
            let badTxCount = 0;
            for (let i = 0; i < rounds; i++) {
                this.logger.info('=== Round: ' + i + ' ===');
                let transactionResult = {
                    data: null,
                    error: null
                };
                let vehicle = this.v2xPaas.getVehicleDrivingData();
                let txWrapper = null;
                try {
                    txWrapper = yield this.vehiclesDAO.updateVelocity(vehicle);
                }
                catch (e) {
                    transactionResult.error = `Error: ${e.toString()}`;
                    simulation.txResults.push(transactionResult);
                    this.logger.info('>>> Error ' + e.toString());
                    badTxCount++;
                    continue;
                }
                createTxTotalTime = createTxTotalTime + txWrapper.creationTime;
                this.logger.info('>>> Time taken to create and sign transaction [ms] ' + txWrapper.creationTime);
                this.logger.info('>>> Time taken to accept and mine transaction [ms] ' + txWrapper.acceptationTime);
                successfullyCommittedTxCount++;
                this.logger.info('>>>>>> Vehicle updated to ' + JSON.stringify(vehicle, null, 4) + ' at time: ' + new Date().getTime());
                acceptTxTimesArray.push(txWrapper.acceptationTime);
                transactionResult.data = txWrapper;
                simulation.txResults.push(transactionResult);
            }
            simulation.acceptedTxCount = successfullyCommittedTxCount;
            simulation.failedTxCount = badTxCount;
            fs.writeFileSync(`results/${this.v2xPaas.getVehicleId()}.json`, JSON.stringify(simulation));
            this.logger.info(`=============== RESULTS ===============`);
            this.logger.info(`There were ${rounds} transaction to be committed to the ledger...`);
            this.logger.info(`=== Committed transactions count = ${successfullyCommittedTxCount}`);
            this.logger.info(`=== Failed transactions count = ${badTxCount}`);
            this.logger.info(`=== Total transactions count = ${rounds}`);
            if (successfullyCommittedTxCount > 0) {
                acceptTxTimesArray = acceptTxTimesArray.sort((n1, n2) => n1 - n2);
                const add = (a, b) => a + b;
                acceptTxTotalTime = acceptTxTimesArray.reduce(add);
                this.logger.info('Average time taken to create and sign a transaction [ms] = ' + createTxTotalTime / successfullyCommittedTxCount);
                this.logger.info('Analysis of accept and mine transaction [ms]: ');
                this.logger.info('=== Average = ' + acceptTxTotalTime / successfullyCommittedTxCount);
                this.logger.info('=== Minimum = ' + acceptTxTimesArray[0]);
                this.logger.info('=== Maximum = ' + acceptTxTimesArray[successfullyCommittedTxCount - 1]);
                let median = 0;
                let middle = Math.floor(successfullyCommittedTxCount / 2);
                if (successfullyCommittedTxCount % 2 == 0) {
                    median = (acceptTxTimesArray[middle] + acceptTxTimesArray[middle - 1]) / 2;
                }
                else {
                    median = acceptTxTimesArray[middle];
                }
                this.logger.info('=== Median = ' + median);
            }
            else {
                this.logger.info('There was no transaction accepted by the ledger');
            }
        });
    }
}
exports.OperationAnalyser = OperationAnalyser;
