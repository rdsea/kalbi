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
const EthTx = require("ethereumjs-tx");
const fs = require("file-system");
const solc = require("solc");
const EthereumKeyExtractor_1 = require("./EthereumKeyExtractor");
const Web3 = require("web3");
class EthereumVehicleDAO {
    constructor(logger) {
        this.logger = logger;
    }
    static createInstance(gethIpAddress, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.instance) {
                return EthereumVehicleDAO.instance;
            }
            EthereumVehicleDAO.instance = new EthereumVehicleDAO(logger);
            yield EthereumVehicleDAO.instance.init(gethIpAddress);
            return EthereumVehicleDAO.instance;
        });
    }
    init(gethIpAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            this.web3 = new Web3(new Web3.providers.HttpProvider("http://" + gethIpAddress));
            this.logger.info('Connected to Ethereum Blockchain at address: http://' + gethIpAddress);
            this.keyExtractor = new EthereumKeyExtractor_1.EthereumKeyExtractor(this.web3, this.logger);
            this.unlockAccount(this.web3);
            this.privateKeyHex = yield this.keyExtractor.getAccountPrivateKeyHex();
        });
    }
    unlockAccount(web3) {
        try {
            web3.personal.unlockAccount(web3.personal.listAccounts[0], '123');
        }
        catch (e) {
            this.logger.error('Error at unlocking account ' + e);
        }
    }
    /**
     * Returns the address of deployed smart contract
     */
    deployContract() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('=== Deploying smart contract ===');
            if (this.isDeployed) {
                throw "Smart contract has already been deployed!";
            }
            let sourceCode = fs.readFileSync('contracts/ConnectedCars.sol', 'utf8');
            let compiledContract = solc.compile(sourceCode, 1);
            let abi = compiledContract.contracts[':ConnectedCars'].interface;
            let bytecode = compiledContract.contracts[':ConnectedCars'].bytecode;
            let gasEstimate = this.web3.eth.estimateGas({ data: '0x' + bytecode });
            let vehiclesContract = this.web3.eth.contract(JSON.parse(abi));
            // Deploy contract syncronous: The address will be added as soon as the contract is mined.
            // Additionally you can watch the transaction by using the "transactionHash" property
            let vehiclesContractDeployed = vehiclesContract.new({
                data: '0x' + bytecode,
                gas: gasEstimate,
                gasPrice: 10,
                from: this.web3.personal.listAccounts[0]
            });
            this.logger.info('>>> Smart contract object created, waiting till its included within a block');
            yield this.sleep(4000);
            while (true) {
                let receipt = this.web3.eth.getTransactionReceipt(vehiclesContractDeployed.transactionHash);
                if (receipt && receipt.contractAddress) {
                    this.contractAddress = receipt.contractAddress;
                    break;
                }
                yield this.sleep(4000);
            }
            this.myContract = vehiclesContract.at(this.contractAddress);
            this.isDeployed = true;
            this.logger.info(`SMART_CONTRACT_ADDRESS_BEGIN${this.contractAddress}SMART_CONTRACT_ADDRESS_END`); // important, do not change this log info here!!!
            return this.contractAddress;
        });
    }
    initContractAtAddress(contractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let sourceCode = fs.readFileSync('contracts/ConnectedCars.sol', 'utf8');
                let compiledContract = solc.compile(sourceCode, 1);
                let abi = compiledContract.contracts[':ConnectedCars'].interface;
                let vehiclesContract = this.web3.eth.contract(JSON.parse(abi));
                this.contractAddress = contractAddress;
                this.myContract = vehiclesContract.at(contractAddress);
            }
            catch (e) {
                this.logger.error('=== Error when initializing smart contract ' + e);
            }
        });
    }
    insert(vehicle) {
        return __awaiter(this, void 0, void 0, function* () {
            let createTxTimeStart = new Date().getTime();
            let vehicleId = this.hashStringToInteger(vehicle.id);
            let txData = this.myContract.insertVehicle.getData(vehicleId, vehicle.velocity, vehicle.acceleration);
            let serializedTx = yield this.buildSerializedTransaction(txData);
            let createTxTimeEnd = new Date().getTime();
            let txHash = yield this.submitTransaction(serializedTx);
            yield this.waitTillTransactionIsInBlock(txHash, 120 * 1000);
            let acceptTxEndTime = new Date().getTime();
            let txWrapper = {
                txId: txHash,
                blockNum: null,
                creationTime: createTxTimeEnd - createTxTimeStart,
                acceptationTime: acceptTxEndTime - createTxTimeEnd,
                payloadData: vehicle
            };
            return txWrapper;
        });
    }
    update(vehicle) {
        return undefined;
    }
    updateVelocity(vehicle) {
        return __awaiter(this, void 0, void 0, function* () {
            let createTxTimeStart = new Date().getTime();
            let vehicleId = this.hashStringToInteger(vehicle.id);
            let txData = this.myContract.updateVehicleVelocity.getData(vehicleId, vehicle.velocity);
            let serializedTx = yield this.buildSerializedTransaction(txData);
            let createTxTimeEnd = new Date().getTime();
            let txHash = yield this.submitTransaction(serializedTx);
            yield this.waitTillTransactionIsInBlock(txHash, 60 * 1000);
            let acceptTxEndTime = new Date().getTime();
            let txWrapper = {
                txId: txHash,
                blockNum: null,
                creationTime: createTxTimeEnd - createTxTimeStart,
                acceptationTime: acceptTxEndTime - createTxTimeEnd,
                payloadData: vehicle
            };
            return txWrapper;
        });
    }
    updateAcceleration(vehicle) {
        return __awaiter(this, void 0, void 0, function* () {
            let createTxTimeStart = new Date().getTime();
            let vehicleId = this.hashStringToInteger(vehicle.id);
            let txData = this.myContract.updateVehicleAcc.getData(vehicleId, vehicle.acceleration);
            let serializedTx = yield this.buildSerializedTransaction(txData);
            let createTxTimeEnd = new Date().getTime();
            let txHash = yield this.submitTransaction(serializedTx);
            yield this.waitTillTransactionIsInBlock(txHash, 60 * 1000);
            let acceptTxEndTime = new Date().getTime();
            let txWrapper = {
                txId: txHash,
                blockNum: null,
                creationTime: createTxTimeEnd - createTxTimeStart,
                acceptationTime: acceptTxEndTime - createTxTimeEnd,
                payloadData: vehicle
            };
            return txWrapper;
        });
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let hashNum = this.hashStringToInteger(id);
            let result = this.myContract.getVehicle(hashNum);
            let car = {
                id: id,
                velocity: result[0],
                acceleration: result[1]
            };
            return car;
        });
    }
    submitTransaction(serializedTx) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            return new Promise((resolve, reject) => {
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
            });
        });
    }
    buildSerializedTransaction(txData) {
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
    waitTillTransactionIsInBlock(txId, timeoutMS) {
        return __awaiter(this, void 0, void 0, function* () {
            let startTime = new Date().getTime();
            while (true) {
                let tx = this.web3.eth.getTransaction(txId);
                if (tx && tx.blockNumber) {
                    break;
                }
                yield this.sleep(20);
                if (timeoutMS) {
                    let nowTime = new Date().getTime();
                    if (nowTime - startTime > timeoutMS) {
                        throw `Transaction wasn't included into the block after ${timeoutMS} ms`;
                    }
                }
            }
        });
    }
    hashStringToInteger(str) {
        let hash = 0, i, chr;
        if (str.length === 0)
            return hash;
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.EthereumVehicleDAO = EthereumVehicleDAO;
