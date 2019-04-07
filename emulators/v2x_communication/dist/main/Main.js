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
const EthereumVehicleDAO_1 = require("./ethereum/EthereumVehicleDAO");
const DrivingDataProducer_1 = require("./driving/DrivingDataProducer");
const DrivingDataConsumer_1 = require("./driving/DrivingDataConsumer");
const V2XPaaS_1 = require("./driving/V2XPaaS");
const log4js = require("log4js");
const fs = require("fs");
const HypFabVehicleDAO_1 = require("./hypfab/HypFabVehicleDAO");
class Main {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // npm run build-start ethereum ip_address deploy-smart-contract
            // npm run build-start ethereum ip_address run-producer vehicle_name rounds_nr contract_address
            // npm run build-start ethereum ip_address run-consumer vehicle_name contract_address
            // npm run build-start hypfab run-producer vehicle_name rounds_nr main_orderer_name
            if (process.argv.length <= 4) {
                this.printUsage();
            }
            if (process.argv[2] == 'ethereum' && process.argv.length > 4) {
                let ipAddress = process.argv[3];
                if (process.argv[4] == 'deploy-smart-contract') {
                    this.logger = this.configureLogger('eth-smart-contract-deployer');
                    let vehiclesDAO = yield EthereumVehicleDAO_1.EthereumVehicleDAO.createInstance(ipAddress, this.logger);
                    // deploy smart contract
                    let contractAddress = yield vehiclesDAO.deployContract();
                }
                else if (process.argv[4] == 'run-producer' && process.argv.length == 8) {
                    let vehicleName = process.argv[5];
                    let roundsNr = +process.argv[6];
                    let contractAddress = process.argv[7];
                    this.logger = this.configureLogger(`eth-vehicle${vehicleName}`);
                    this.logger.info('======================================================');
                    this.logger.info('======================== ETHEREUM ====================');
                    this.logger.info('======================================================');
                    let vehiclesDAO = yield EthereumVehicleDAO_1.EthereumVehicleDAO.createInstance(ipAddress, this.logger);
                    let v2xPaaS = new V2XPaaS_1.V2XPaaS(vehicleName);
                    yield vehiclesDAO.initContractAtAddress(contractAddress);
                    try {
                        let drivingDataProducer = new DrivingDataProducer_1.DrivingDataProducer(vehiclesDAO, v2xPaaS, this.logger);
                        yield drivingDataProducer.initialize();
                        yield drivingDataProducer.run(roundsNr);
                    }
                    catch (e) {
                        this.logger.error(e);
                    }
                }
                else if (process.argv[4] == 'run-consumer' && process.argv.length == 7) {
                    let vehicleName = process.argv[5];
                    let contractAddress = process.argv[6];
                    this.logger = this.configureLogger(`eth-vehicle${vehicleName}-consumer`);
                    let vehiclesDAO = yield EthereumVehicleDAO_1.EthereumVehicleDAO.createInstance(ipAddress, this.logger);
                    let v2xPaaS = new V2XPaaS_1.V2XPaaS(vehicleName);
                    yield vehiclesDAO.initContractAtAddress(contractAddress);
                    let drivingDataConsumer = new DrivingDataConsumer_1.DrivingDataConsumer(vehiclesDAO, v2xPaaS, this.logger);
                    yield drivingDataConsumer.run();
                }
                else {
                    this.printUsage();
                }
            }
            else if (process.argv[2] == 'eos') {
            }
            else if (process.argv[2] == 'hypfab' && process.argv.length >= 6) {
                if (process.argv[3] == 'run-producer' && process.argv.length == 7) {
                    let vehicleName = process.argv[4];
                    let roundsNr = +process.argv[5];
                    let mainOrdererName = process.argv[6];
                    this.logger = this.configureLogger(`hypfab-vehicle${vehicleName}`);
                    this.logger.info('======================================================');
                    this.logger.info('=================== HYPERLEDGER-FABRIC ===============');
                    this.logger.info('======================================================');
                    let v2xPaaS = new V2XPaaS_1.V2XPaaS(vehicleName);
                    let vehiclesDAO = new HypFabVehicleDAO_1.HypFabVehicleDAO(this.logger, vehicleName, mainOrdererName);
                    try {
                        yield vehiclesDAO.init();
                    }
                    catch (e) {
                        this.logger.warn('Error when initializing vehiclesDAO = ' + e);
                    }
                    try {
                        let drivingDataProducer = new DrivingDataProducer_1.DrivingDataProducer(vehiclesDAO, v2xPaaS, this.logger);
                        yield drivingDataProducer.initialize();
                        yield drivingDataProducer.run(roundsNr);
                    }
                    catch (e) {
                        this.logger.error(e);
                    }
                }
                else {
                    this.printUsage();
                }
            }
            else {
                this.printUsage();
            }
        });
    }
    printUsage() {
        console.log('Usage:');
        console.log('npm run build-start ethereum ip_address deploy-smart-contract');
        console.log('npm run build-start ethereum ip_address run-producer vehicle_name rounds_nr contract_address');
        // console.log('npm run build-start ethereum ip_address run-consumer vehicle_name contract_address');
        console.log('npm run build-start hypfab run-producer vehicle_name rounds_nr main_orderer_name');
    }
    configureLogger(logOutputFilename) {
        let log4jsConfStr = fs.readFileSync('config/log4js.json').toString();
        let log4jsConfig = JSON.parse(log4jsConfStr);
        log4jsConfig.appenders.appFile.filename = `log/${logOutputFilename}`;
        log4js.configure(log4jsConfig);
        return log4js.getLogger('default');
    }
}
let main = new Main();
main.run();
