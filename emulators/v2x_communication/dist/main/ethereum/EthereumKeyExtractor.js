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
const keythereum = require("keythereum");
class EthereumKeyExtractor {
    constructor(web3, logger) {
        this.web3 = web3;
        this.logger = logger;
    }
    getAccountPrivateKeyHex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let accountAddress = this.web3.personal.listAccounts[0];
                this.logger.info(`>>> Retrieving private key from file of account address: ${accountAddress}`);
                let datadir = '/data';
                let password = '123';
                let keyObject = keythereum.importFromFile(accountAddress, datadir);
                this.logger.info(`>>> Key object imported from file...`);
                let privateKeyHex = keythereum.recover(password, keyObject).toString('hex');
                return privateKeyHex;
            }
            catch (e) {
                return "";
            }
        });
    }
}
exports.EthereumKeyExtractor = EthereumKeyExtractor;
