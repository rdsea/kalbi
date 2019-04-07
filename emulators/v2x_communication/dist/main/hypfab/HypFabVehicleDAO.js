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
const fabric_client = require("fabric-client");
const fabric_ca_client = require("fabric-ca-client");
class HypFabVehicleDAO {
    constructor(logger, vehicleName, mainOrdererName) {
        this.logger = logger;
        this.vehicleName = vehicleName;
        this.mainOrdererName = mainOrdererName;
        this.fabricClient = new fabric_client();
        this.initialized = false;
        this.userName = `user${this.vehicleName}`;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized) {
                return;
            }
            this.logger.info('HypFabVehicleDAO is initializing...');
            this.initialized = true;
            this.channel = this.fabricClient.newChannel('mychannel');
            this.peer = this.fabricClient.newPeer(`grpc://${this.vehicleName}_peer.org1.example.com:7051`);
            this.orderer = this.fabricClient.newOrderer(`grpc://${this.mainOrdererName}.example.com:7050`);
            this.channel.addPeer(this.peer, 'Org1MSP');
            this.channel.addOrderer(this.orderer);
            let storePath = `hfc-key-store${this.vehicleName}`;
            let self = this;
            let memberUser = null;
            let cryptoSuite = null;
            return new Promise((resolve, reject) => {
                fabric_client.newDefaultKeyValueStore({ path: storePath }).then((stateStore) => {
                    this.fabricClient.setStateStore(stateStore);
                    cryptoSuite = fabric_client.newCryptoSuite();
                    let cryptoStore = fabric_client.newCryptoKeyStore({ path: storePath });
                    cryptoSuite.setCryptoKeyStore(cryptoStore);
                    this.fabricClient.setCryptoSuite(cryptoSuite);
                    return this.fabricClient.getUserContext(this.userName, true);
                }).then((userFromStore) => __awaiter(this, void 0, void 0, function* () {
                    if (userFromStore && userFromStore.isEnrolled()) {
                        this.logger.info(`Successfully loaded ${this.userName} from persistence`);
                        memberUser = userFromStore;
                        resolve(memberUser);
                    }
                    else {
                        memberUser = yield self.registerUser(cryptoSuite);
                        resolve(memberUser);
                    }
                })).catch((err) => {
                    reject(err);
                });
            });
        });
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                //targets : --- letting this default to the peers assigned to the channel
                chaincodeId: 'v2x_sc',
                fcn: 'queryVehicle',
                args: [`VEH${id}`]
            };
            let vehicleData = yield this.createAndSubmitQueryTransaction(request);
            let returnedVehicle = JSON.parse(vehicleData);
            let vehicle = {
                id: returnedVehicle.vin,
                velocity: returnedVehicle.vel,
                acceleration: returnedVehicle.acc
            };
            return vehicle;
        });
    }
    insert(vehicle) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = {
                //targets: let default to the peer assigned to the client
                chaincodeId: 'v2x_sc',
                fcn: 'createVehicle',
                args: [`VEH${vehicle.id}`, `${vehicle.id}`, `Model${vehicle.id}`, `${vehicle.velocity}`, `${vehicle.acceleration}`, '45', '12'],
                chainId: 'mychannel'
            };
            let res = yield this.createAndSubmitInvokeTransaction(request, vehicle);
            return res;
        });
    }
    update(vehicle) {
        return undefined;
    }
    updateVelocity(vehicle) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = {
                //targets: let default to the peer assigned to the client
                chaincodeId: 'v2x_sc',
                fcn: 'updateVehicleVelocity',
                args: [`VEH${vehicle.id}`, `${vehicle.velocity}`],
                chainId: 'mychannel'
            };
            let res = yield this.createAndSubmitInvokeTransaction(request, vehicle);
            return res;
        });
    }
    registerUser(crypto_suite) {
        return __awaiter(this, void 0, void 0, function* () {
            let adminUser = null;
            let memberUser = null;
            // be sure to change the http to https when the CA is running TLS enabled
            let fabricCAClient = new fabric_ca_client(`http://ca.example.com:7054`, null, 'ca.org1.example.com', crypto_suite);
            let self = this;
            return new Promise((resolve, reject) => {
                this.fabricClient.getUserContext('admin', true).then((user_from_store) => __awaiter(this, void 0, void 0, function* () {
                    if (user_from_store && user_from_store.isEnrolled()) {
                        this.logger.info('Successfully loaded admin from persistence');
                        adminUser = user_from_store;
                    }
                    else {
                        adminUser = yield self.enrollAdmin(crypto_suite);
                    }
                    // at this point we should have the admin user
                    // first need to register the user with the CA server
                    return fabricCAClient.register({
                        enrollmentID: this.userName,
                        affiliation: 'org1.department1',
                        role: 'client'
                    }, adminUser);
                })).then((secret) => {
                    // next we need to enroll the user with CA server
                    return fabricCAClient.enroll({ enrollmentID: this.userName, enrollmentSecret: secret });
                }).then((enrollment) => {
                    return this.fabricClient.createUser({
                        username: this.userName,
                        mspid: 'Org1MSP',
                        cryptoContent: {
                            privateKeyPEM: enrollment.key.toBytes(),
                            signedCertPEM: enrollment.certificate
                        }
                    });
                }).then((user) => {
                    this.logger.info(`Successfully enrolled member user "${this.userName}" `);
                    memberUser = user;
                    return this.fabricClient.setUserContext(memberUser);
                }).then(() => {
                    resolve(memberUser);
                }).catch((err) => {
                    reject(err);
                });
            });
        });
    }
    enrollAdmin(crypto_suite) {
        return __awaiter(this, void 0, void 0, function* () {
            let adminUser = null;
            let tlsOptions = {
                trustedRoots: Buffer.from([]),
                verify: false
            };
            let fabricCAClient = new fabric_ca_client(`http://ca.example.com:7054`, tlsOptions, 'ca.org1.example.com', crypto_suite);
            return new Promise((resolve, reject) => {
                this.fabricClient.getUserContext('admin', true).then((user_from_store) => {
                    if (user_from_store && user_from_store.isEnrolled()) {
                        this.logger.info('Successfully loaded admin from persistence');
                        adminUser = user_from_store;
                        return null;
                    }
                    else {
                        // need to enroll it with CA server
                        return fabricCAClient.enroll({
                            enrollmentID: 'admin',
                            enrollmentSecret: 'adminpw'
                        }).then((enrollment) => {
                            this.logger.info('Successfully enrolled admin user "admin"');
                            return this.fabricClient.createUser({
                                username: 'admin',
                                mspid: 'Org1MSP',
                                cryptoContent: {
                                    privateKeyPEM: enrollment.key.toBytes(),
                                    signedCertPEM: enrollment.certificate
                                }
                            });
                        }).then((user) => {
                            this.logger.info('Successfully set admin user');
                            adminUser = user;
                            return this.fabricClient.setUserContext(user);
                        }).catch((err) => {
                            throw new Error('Failed to enroll admin ' + err);
                        });
                    }
                }).then(() => {
                    resolve(adminUser);
                }).catch((err) => {
                    reject(err);
                });
            });
        });
    }
    createAndSubmitInvokeTransaction(request, vehicle) {
        return __awaiter(this, void 0, void 0, function* () {
            let createTxTimeStart = 0;
            let createTxTimeEnd = 0;
            let acceptTxTimeEnd = 0;
            let tx_id = null;
            return new Promise((resolve, reject) => {
                createTxTimeStart = new Date().getTime();
                tx_id = this.fabricClient.newTransactionID(false);
                // send the transaction proposal to the peers
                request.txId = tx_id;
                this.channel.sendTransactionProposal(request).then((results) => {
                    let proposalResponses = results[0];
                    let proposal = results[1];
                    let isProposalGood = false;
                    if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                        isProposalGood = true;
                    }
                    else {
                        this.logger.error(`Proposal is bad. Responses = ${JSON.stringify(proposalResponses, null, 4)}`);
                    }
                    if (isProposalGood) {
                        // build up the request for the orderer to have the transaction committed
                        let txRequest = {
                            proposalResponses: proposalResponses,
                            proposal: proposal,
                            txId: tx_id
                        };
                        // set the transaction listener and set a timeout of 60 sec
                        // if the transaction did not get committed within the timeout period,
                        // report a TIMEOUT status
                        let transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
                        let promises = [];
                        this.logger.info(`Successfully sent Proposal and received ProposalResponse: Status - ${proposalResponses[0].response.status}, message - ${proposalResponses[0].response.message}`);
                        this.logger.info(`Transaction id = ${transaction_id_string}`);
                        createTxTimeEnd = new Date().getTime();
                        let sendPromise = this.channel.sendTransaction(txRequest);
                        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
                        // get an eventhub once the fabric client has a user assigned. The user
                        // is required bacause the event registration must be signed
                        let eventHub = this.channel.newChannelEventHub(this.peer);
                        // using resolve the promise so that result status may be processed
                        // under the then clause rather than having the catch clause process
                        // the status
                        let txPromise = new Promise((resolve, reject) => {
                            let handle = setTimeout(() => {
                                eventHub.unregisterTxEvent(transaction_id_string);
                                eventHub.disconnect();
                                resolve({ event_status: 'TIMEOUT' }); //we could use reject(new Error('Trnasaction did not complete within 60 seconds'));
                            }, 60000);
                            eventHub.registerTxEvent(transaction_id_string, (tx, code) => {
                                // this is the callback for transaction event status
                                // first some clean up of event listener
                                clearTimeout(handle);
                                // now let the application know what happened
                                let return_status = { event_status: code, tx_id: transaction_id_string };
                                if (code !== 'VALID') {
                                    reject(new Error('Problem with the transaction, event status ::' + code));
                                }
                                else {
                                    resolve(return_status);
                                }
                            }, (err) => {
                                //this is the callback if something goes wrong with the event registration or processing
                                reject(new Error('There was a problem with the eventhub ::' + err));
                            }, { disconnect: true } //disconnect when complete
                            );
                            eventHub.connect();
                        });
                        promises.push(txPromise);
                        return Promise.all(promises);
                    }
                    else {
                        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
                    }
                }).then((results) => {
                    if (results && results[0] && results[0].status === 'SUCCESS') {
                    }
                    else {
                        throw new Error('Failed to order the transaction. Error code: ' + results[0].status);
                    }
                    if (results && results[1] && results[1].event_status === 'VALID') {
                        this.logger.info('Successfully committed the change to the ledger by the peer');
                        acceptTxTimeEnd = new Date().getTime();
                        let txWrapper = {
                            txId: tx_id.getTransactionID(),
                            blockNum: null,
                            creationTime: createTxTimeEnd - createTxTimeStart,
                            acceptationTime: acceptTxTimeEnd - createTxTimeEnd,
                            payloadData: vehicle
                        };
                        resolve(txWrapper);
                    }
                    else {
                        throw new Error('Transaction failed to be committed to the ledger due to ::' + results[1].event_status);
                    }
                }).catch((err) => {
                    reject(`Failed to invoke successfully:: ${err}`);
                });
            });
        });
    }
    createAndSubmitQueryTransaction(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.channel.queryByChaincode(request).then((query_responses) => {
                    // query_responses could have more than one  results if there multiple peers were used as targets
                    if (query_responses && query_responses.length == 1) {
                        if (query_responses[0] instanceof Error) {
                            reject('Error from Query = ' + query_responses[0]);
                        }
                        else {
                            resolve(query_responses[0].toString());
                        }
                    }
                    else {
                        resolve('');
                    }
                }).catch((err) => {
                    reject('Failed to query successfully :: ' + err);
                });
            });
        });
    }
}
exports.HypFabVehicleDAO = HypFabVehicleDAO;
