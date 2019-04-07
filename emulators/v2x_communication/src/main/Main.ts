import {EthereumVehicleDAO} from "./ethereum/EthereumVehicleDAO";
import {DrivingDataProducer} from "./driving/DrivingDataProducer";
import {DrivingDataConsumer} from "./driving/DrivingDataConsumer";
import {V2XPaaS} from "./driving/V2XPaaS";
import * as log4js from 'log4js';
import {Logger} from "log4js";
import * as fs from "fs";
import {HypFabVehicleDAO} from "./hypfab/HypFabVehicleDAO";


class Main {

    private logger: Logger;

    async run() {


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

                let vehiclesDAO = await EthereumVehicleDAO.createInstance(ipAddress, this.logger);

                // deploy smart contract
                let contractAddress = await vehiclesDAO.deployContract();

            } else if (process.argv[4] == 'run-producer' && process.argv.length == 8) {

                let vehicleName: string = process.argv[5];
                let roundsNr: number = +process.argv[6];
                let contractAddress = process.argv[7];

                this.logger = this.configureLogger(`eth-vehicle${vehicleName}`);

                this.logger.info('======================================================');
                this.logger.info('======================== ETHEREUM ====================');
                this.logger.info('======================================================');

                let vehiclesDAO = await EthereumVehicleDAO.createInstance(ipAddress, this.logger);

                let v2xPaaS = new V2XPaaS(vehicleName);

                await vehiclesDAO.initContractAtAddress(contractAddress);

                try {
                    let drivingDataProducer: DrivingDataProducer = new DrivingDataProducer(vehiclesDAO, v2xPaaS, this.logger);
                    await drivingDataProducer.initialize();
                    await drivingDataProducer.run(roundsNr);
                } catch (e) {
                    this.logger.error(e);
                }



            } else if (process.argv[4] == 'run-consumer' && process.argv.length == 7) {

                let vehicleName: string = process.argv[5];
                let contractAddress = process.argv[6];

                this.logger = this.configureLogger(`eth-vehicle${vehicleName}-consumer`);
                let vehiclesDAO = await EthereumVehicleDAO.createInstance(ipAddress, this.logger);

                let v2xPaaS = new V2XPaaS(vehicleName);

                await vehiclesDAO.initContractAtAddress(contractAddress);

                let drivingDataConsumer: DrivingDataConsumer = new DrivingDataConsumer(vehiclesDAO, v2xPaaS, this.logger);
                await drivingDataConsumer.run();

            } else {
                this.printUsage();
            }

        } else if (process.argv[2] == 'eos') {


        } else if (process.argv[2] == 'hypfab' && process.argv.length >= 6) {

            if (process.argv[3] == 'run-producer' && process.argv.length == 7) {

                let vehicleName: string = process.argv[4];
                let roundsNr: number = +process.argv[5];
                let mainOrdererName: string = process.argv[6];

                this.logger = this.configureLogger(`hypfab-vehicle${vehicleName}`);


                this.logger.info('======================================================');
                this.logger.info('=================== HYPERLEDGER-FABRIC ===============');
                this.logger.info('======================================================');

                let v2xPaaS = new V2XPaaS(vehicleName);
                let vehiclesDAO = new HypFabVehicleDAO(this.logger, vehicleName, mainOrdererName);

                try {
                    await vehiclesDAO.init();
                } catch (e) {
                    this.logger.warn('Error when initializing vehiclesDAO = ' + e);
                }

                try {
                    let drivingDataProducer: DrivingDataProducer = new DrivingDataProducer(vehiclesDAO, v2xPaaS, this.logger);
                    await drivingDataProducer.initialize();
                    await drivingDataProducer.run(roundsNr);
                } catch (e) {
                    this.logger.error(e);
                }


            } else {
                this.printUsage();
            }
        } else {
            this.printUsage();
        }


    }

    private printUsage() {

        console.log('Usage:');
        console.log('npm run build-start ethereum ip_address deploy-smart-contract');
        console.log('npm run build-start ethereum ip_address run-producer vehicle_name rounds_nr contract_address');
        // console.log('npm run build-start ethereum ip_address run-consumer vehicle_name contract_address');

        console.log('npm run build-start hypfab run-producer vehicle_name rounds_nr main_orderer_name');

    }

    private configureLogger(logOutputFilename: string): Logger {

        let log4jsConfStr: string = fs.readFileSync('config/log4js.json').toString();
        let log4jsConfig = JSON.parse(log4jsConfStr);

        log4jsConfig.appenders.appFile.filename = `log/${logOutputFilename}`;
        log4js.configure(log4jsConfig);

        return log4js.getLogger('default');
    }

}


let main = new Main();
main.run();
