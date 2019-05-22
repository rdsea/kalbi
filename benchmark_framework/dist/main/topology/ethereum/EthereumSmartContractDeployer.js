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
const types_1 = require("../../types");
class EthereumSmartContractDeployer {
    constructor(logger, commandExecutor, experimentConfiguration, config) {
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.experimentConfiguration = experimentConfiguration;
        this.config = config;
    }
    deploySmartContract(node, tryNr) {
        return __awaiter(this, void 0, void 0, function* () {
            if (tryNr == 11) {
                return Promise.reject(`Smart contract cannot be deployed after ${tryNr} times`);
            }
            this.logger.info('====== Deploying smart contract ======');
            node = this.findNodeToDeploySmartContract(node);
            this.logger.info("====== Deploying smart contract to container " + node.name + " ======");
            let bcIpAddress = yield this.obtainIPAddressOfEth(node.hostMachine.ipAddress, node.name);
            yield this.stopAndRemoveSmartContractDeployer(node);
            let deploySmartContractCmd = this.createDeploySmartContractInDockerCommand(node.hostMachine.ipAddress, bcIpAddress);
            let deployContractOutput = '';
            try {
                deployContractOutput = yield this.commandExecutor.executeCommand(deploySmartContractCmd);
            }
            catch (e) {
                if (e.message.toString().indexOf('Contract transaction couldn\'t be found after 50 blocks') > -1) {
                    this.logger.error('Smart contract wasn\'t deployed');
                    this.logger.error(e.name + ' ' + e.message);
                    this.logger.info('====== Redeploying... ======');
                    return yield this.deploySmartContract(node, tryNr++);
                }
                else {
                    return Promise.reject(e);
                }
            }
            let begin = deployContractOutput.indexOf('SMART_CONTRACT_ADDRESS_BEGIN');
            let end = deployContractOutput.indexOf('SMART_CONTRACT_ADDRESS_END');
            if (begin == -1 || end == -1) {
                this.logger.error('Smart contract wasn\'t deployed');
                this.logger.error('Data returned by deployer cannot be parsed');
                this.logger.info('Data' + deployContractOutput);
                this.logger.info('====== Redeploying... ======');
                return yield this.deploySmartContract(node, tryNr++);
            }
            let contractAddress = deployContractOutput.substring(begin + 28, end);
            this.logger.info('====== Smart contract deployed at address = ' + contractAddress + ' ======');
            EthereumSmartContractDeployer.smartContractAddress = contractAddress;
            return contractAddress;
        });
    }
    findNodeToDeploySmartContract(node) {
        if (node.blockchainArtefact.bcOperation == types_1.BlockchainRole.none || node.blockchainArtefact.bcOperation == types_1.BlockchainRole.creator) {
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                let returned = this.findNodeToDeploySmartContract(peer);
                return returned;
            }
        }
        else {
            return node;
        }
    }
    createDeploySmartContractInDockerCommand(vmIpAddress, bcIPAddress) {
        let cmd = `'docker run -v ~/ethereum/tmp-keystore/keystore:/data/keystore --network="eth" --name smart-contract-deployer --net-alias=smart-contract-deployer ${this.experimentConfiguration.workloadEmulator.imageTag} start ethereum ${bcIPAddress} deploy-smart-contract'`;
        cmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${vmIpAddress} ` + cmd;
        return cmd;
    }
    stopAndRemoveSmartContractDeployer(node) {
        return __awaiter(this, void 0, void 0, function* () {
            let stopSmartContractContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker stop smart-contract-deployer'`;
            let removeSmartContractContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker rm smart-contract-deployer'`;
            this.logger.info('====== Stoping and Removing smart-contract-deployer container ======');
            try {
                yield this.commandExecutor.executeCommand(stopSmartContractContainerCmd);
            }
            catch (e) {
            }
            try {
                yield this.commandExecutor.executeCommand(removeSmartContractContainerCmd);
            }
            catch (e) {
            }
        });
    }
    obtainIPAddressOfEth(vmIpAddress, dockerContainerName) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${vmIpAddress} "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${dockerContainerName}_bc"`;
            let ipAddrs = yield this.commandExecutor.executeCommand(cmd);
            ipAddrs = ipAddrs.substring(0, ipAddrs.length - 1); // removing \n at the end
            ipAddrs = ipAddrs + ':8545';
            return ipAddrs;
        });
    }
}
EthereumSmartContractDeployer.smartContractAddress = '';
exports.EthereumSmartContractDeployer = EthereumSmartContractDeployer;
//# sourceMappingURL=EthereumSmartContractDeployer.js.map