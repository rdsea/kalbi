import * as keythereum from "keythereum";
import {Logger} from "log4js";


export class EthereumKeyExtractor {


    constructor(private web3, private logger: Logger) {


    }


    public async getAccountPrivateKeyHex() {

        try {
            let accountAddress = this.web3.personal.listAccounts[0];

            this.logger.info(`>>> Retrieving private key from file of account address: ${accountAddress}`);

            let datadir = '/data';
            let password = '123';

            let keyObject = keythereum.importFromFile(accountAddress, datadir);
            this.logger.info(`>>> Key object imported from file...`);
            let privateKeyHex = keythereum.recover(password, keyObject).toString('hex');

            return privateKeyHex;
        } catch (e) {

            return "";
        }
    }
}