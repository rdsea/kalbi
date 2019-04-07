import * as EthTx from "ethereumjs-tx";
import * as fs from 'file-system'
import * as solc from 'solc'
import {EthereumKeyExtractor} from "./EthereumKeyExtractor";
import * as Web3 from 'web3'
import {Logger} from "log4js";


export class EthereumVehicleDAO implements IDrivingDataDAO {


    private web3;
    private contractAddress: string;
    private privateKeyHex: string;
    private myContract;

    private isDeployed: boolean;

    private keyExtractor: EthereumKeyExtractor;


    private static instance: EthereumVehicleDAO;

    public static async createInstance(gethIpAddress: string, logger: Logger) {

        if (this.instance) {
            return EthereumVehicleDAO.instance;
        }

        EthereumVehicleDAO.instance = new EthereumVehicleDAO(logger);
        await EthereumVehicleDAO.instance.init(gethIpAddress);

        return EthereumVehicleDAO.instance;

    }

    private constructor(private logger: Logger) {

    }

    private async init(gethIpAddress: string) {

        this.web3 = new Web3(new Web3.providers.HttpProvider("http://" + gethIpAddress));

        this.logger.info('Connected to Ethereum Blockchain at address: http://' + gethIpAddress );

        this.keyExtractor = new EthereumKeyExtractor(this.web3, this.logger);

        this.unlockAccount(this.web3);

        this.privateKeyHex = await this.keyExtractor.getAccountPrivateKeyHex();
    }

    private unlockAccount(web3) {
        try {
            web3.personal.unlockAccount(web3.personal.listAccounts[0], '123');
        } catch (e) {
            this.logger.error('Error at unlocking account ' + e);
        }
    }

    /**
     * Returns the address of deployed smart contract
     */
    async deployContract() {

        this.logger.info('=== Deploying smart contract ===');

        if (this.isDeployed) {
            throw "Smart contract has already been deployed!";
        }

        let sourceCode = fs.readFileSync('contracts/ConnectedCars.sol', 'utf8');
        let compiledContract = solc.compile(sourceCode, 1);

        let abi = compiledContract.contracts[':ConnectedCars'].interface;
        let bytecode = compiledContract.contracts[':ConnectedCars'].bytecode;

        let gasEstimate = this.web3.eth.estimateGas({data: '0x' + bytecode});
        let vehiclesContract = this.web3.eth.contract(JSON.parse(abi));

        // Deploy contract syncronous: The address will be added as soon as the contract is mined.
        // Additionally you can watch the transaction by using the "transactionHash" property
        let vehiclesContractDeployed = vehiclesContract.new(
            {
                data: '0x' + bytecode,
                gas: gasEstimate,
                gasPrice: 10,
                from: this.web3.personal.listAccounts[0]
            }
        );

        this.logger.info('>>> Smart contract object created, waiting till its included within a block');

        await this.sleep(4000);


        while (true) {
            let receipt = this.web3.eth.getTransactionReceipt(vehiclesContractDeployed.transactionHash);
            if (receipt && receipt.contractAddress) {
                this.contractAddress = receipt.contractAddress;
                break;
            }
            await this.sleep(4000);
        }

        this.myContract = vehiclesContract.at(this.contractAddress);

        this.isDeployed = true;

        this.logger.info(`SMART_CONTRACT_ADDRESS_BEGIN${this.contractAddress}SMART_CONTRACT_ADDRESS_END`); // important, do not change this log info here!!!

        return this.contractAddress;

    }

    async initContractAtAddress(contractAddress) {

        try {
            let sourceCode = fs.readFileSync('contracts/ConnectedCars.sol', 'utf8');
            let compiledContract = solc.compile(sourceCode, 1);

            let abi = compiledContract.contracts[':ConnectedCars'].interface;

            let vehiclesContract = this.web3.eth.contract(JSON.parse(abi));

            this.contractAddress = contractAddress;
            this.myContract = vehiclesContract.at(contractAddress);
        } catch (e) {
            this.logger.error('=== Error when initializing smart contract ' + e);
        }

    }

    async insert(vehicle: DrivingData): Promise<TransactionAnalysisWrapper> {

        let createTxTimeStart = new Date().getTime();

        let vehicleId: number = this.hashStringToInteger(vehicle.id);

        let txData = this.myContract.insertVehicle.getData(vehicleId, vehicle.velocity, vehicle.acceleration);

        let serializedTx = await this.buildSerializedTransaction(txData);

        let createTxTimeEnd = new Date().getTime();

        let txHash = await this.submitTransaction(serializedTx);

        await this.waitTillTransactionIsInBlock(txHash, 120 * 1000);

        let acceptTxEndTime = new Date().getTime();

        let txWrapper: TransactionAnalysisWrapper = {
            txId: txHash,
            blockNum: null,
            creationTime: createTxTimeEnd - createTxTimeStart,
            acceptationTime: acceptTxEndTime - createTxTimeEnd,
            payloadData: vehicle
        };

        return txWrapper;
    }

    update(vehicle: DrivingData): Promise<TransactionAnalysisWrapper> {
        return undefined;
    }




    async updateVelocity(vehicle: DrivingData): Promise<TransactionAnalysisWrapper> {

        let createTxTimeStart = new Date().getTime();

        let vehicleId: number = this.hashStringToInteger(vehicle.id);

        let txData = this.myContract.updateVehicleVelocity.getData(vehicleId, vehicle.velocity);

        let serializedTx = await this.buildSerializedTransaction(txData);

        let createTxTimeEnd = new Date().getTime();


        let txHash = await this.submitTransaction(serializedTx);

        await this.waitTillTransactionIsInBlock(txHash, 60 * 1000);

        let acceptTxEndTime = new Date().getTime();

        let txWrapper: TransactionAnalysisWrapper = {
            txId: txHash,
            blockNum: null,
            creationTime: createTxTimeEnd - createTxTimeStart,
            acceptationTime: acceptTxEndTime - createTxTimeEnd,
            payloadData: vehicle
        };

        return txWrapper;
    }

    async updateAcceleration(vehicle: DrivingData): Promise<TransactionAnalysisWrapper> {

        let createTxTimeStart = new Date().getTime();

        let vehicleId: number = this.hashStringToInteger(vehicle.id);

        let txData = this.myContract.updateVehicleAcc.getData(vehicleId, vehicle.acceleration);

        let serializedTx = await this.buildSerializedTransaction(txData);

        let createTxTimeEnd = new Date().getTime();


        let txHash = await this.submitTransaction(serializedTx);

        await this.waitTillTransactionIsInBlock(txHash, 60 * 1000);

        let acceptTxEndTime = new Date().getTime();

        let txWrapper: TransactionAnalysisWrapper = {
            txId: txHash,
            blockNum: null,
            creationTime: createTxTimeEnd - createTxTimeStart,
            acceptationTime: acceptTxEndTime - createTxTimeEnd,
            payloadData: vehicle
        };

        return txWrapper;

    }


    async get(id: string): Promise<DrivingData> {

        let hashNum: number = this.hashStringToInteger(id);
        let result = this.myContract.getVehicle(hashNum);

        let car: DrivingData = {
            id: id,
            velocity: result[0],
            acceleration: result[1]
        };

        return car;
    }


    private async submitTransaction(serializedTx): Promise<any> {

        let self = this;

        return new Promise(
            (resolve, reject) => {

                this.web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
                    if (!err) {
                        self.logger.info('>>> Transaction has been sent, id = ' + hash);
                        resolve(hash);
                    }
                    else {
                        self.logger.info('>>> Error when sending txResults ' + err);
                        reject(err);
                    }
                });

            }
        );

    }

    private buildSerializedTransaction(txData) {

        let privateKeyHex = this.privateKeyHex;

        let nonce = this.web3.eth.getTransactionCount(this.web3.personal.listAccounts[0]);

        let privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
        let rawTxParams = {
            nonce: this.web3.toHex(nonce),
            gasPrice: '0x0',
            gasLimit: '0x30000',
            to: this.contractAddress,
            value: this.web3.toHex(0),
            data: txData
        };

        let rawTx = new EthTx(rawTxParams);

        rawTx.sign(privateKeyBuffer);

        let serializedTx = rawTx.serialize();

        return serializedTx;
    }

    private async waitTillTransactionIsInBlock(txId: string, timeoutMS: number) {

        let startTime: number = new Date().getTime();

        while (true) {
            let tx = this.web3.eth.getTransaction(txId);
            if (tx && tx.blockNumber) {
                break;
            }
            await this.sleep(20);

            if (timeoutMS) {
                let nowTime: number = new Date().getTime();
                if (nowTime - startTime > timeoutMS) {
                    throw `Transaction wasn't included into the block after ${timeoutMS} ms`;
                }
            }
        }
    }

    private hashStringToInteger(str: string): number {
        let hash:number = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    private async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


}