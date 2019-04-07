import {Logger} from "log4js";
import {CommandExecutor} from "../../util/CommandExecutor";
import {BlockchainRole, Configuration, ExperimentsConfiguration, Node} from "../../types";


export class EthereumSmartContractDeployer {

    public static smartContractAddress = '';

    constructor(private logger: Logger,
                private commandExecutor: CommandExecutor,
                private experimentConfiguration: ExperimentsConfiguration,
                private config: Configuration) {

    }

    public async deploySmartContract(node: Node, tryNr: number): Promise<string> {

        if (tryNr == 11) {
            return Promise.reject(`Smart contract cannot be deployed after ${tryNr} times`);
        }

        this.logger.info('====== Deploying smart contract ======');

        node = this.findNodeToDeploySmartContract(node);

        this.logger.info("====== Deploying smart contract to container " + node.name + " ======");

        let bcIpAddress = await this.obtainIPAddressOfEth(node.hostMachine.ipAddress, node.name);

        await this.stopAndRemoveSmartContractDeployer(node);
        let deploySmartContractCmd: string = this.createDeploySmartContractInDockerCommand(node.hostMachine.ipAddress, bcIpAddress);

        let deployContractOutput: string = '';
        try {
            deployContractOutput = await this.commandExecutor.executeCommand(deploySmartContractCmd);
        } catch (e) {
            if (e.message.toString().indexOf('Contract transaction couldn\'t be found after 50 blocks') > -1) {
                this.logger.error('Smart contract wasn\'t deployed');
                this.logger.error(e.name + ' ' + e.message);
                this.logger.info('====== Redeploying... ======');
                return await this.deploySmartContract(node, tryNr++);
            } else {
                return Promise.reject(e);
            }
        }

        let begin: number = deployContractOutput.indexOf('SMART_CONTRACT_ADDRESS_BEGIN');
        let end: number = deployContractOutput.indexOf('SMART_CONTRACT_ADDRESS_END');

        if (begin == -1 || end == -1) {
            this.logger.error('Smart contract wasn\'t deployed');
            this.logger.error('Data returned by deployer cannot be parsed');
            this.logger.info('Data' + deployContractOutput);
            this.logger.info('====== Redeploying... ======');
            return await this.deploySmartContract(node, tryNr++);
        }

        let contractAddress: string = deployContractOutput.substring(begin + 28, end);

        this.logger.info('====== Smart contract deployed at address = ' + contractAddress + ' ======');
        EthereumSmartContractDeployer.smartContractAddress = contractAddress;

        return contractAddress;
    }

    private findNodeToDeploySmartContract(node: Node) {
        if (node.blockchainArtefact.bcOperation == BlockchainRole.none || node.blockchainArtefact.bcOperation == BlockchainRole.creator) {
            for (let connection of node.connections) {
                let peer: Node = connection.connectionEndpoint;
                let returned: Node = this.findNodeToDeploySmartContract(peer);
                return returned;
            }
        } else {
            return node;
        }
    }

    private createDeploySmartContractInDockerCommand(vmIpAddress: string, bcIPAddress: string): string {

        let cmd: string = `'docker run -v ~/ethereum/tmp-keystore/keystore:/data/keystore --network="eth" --name smart-contract-deployer --net-alias=smart-contract-deployer ${this.experimentConfiguration.workloadEmulator.imageTag} start ethereum ${bcIPAddress} deploy-smart-contract'`;

        cmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${vmIpAddress} ` + cmd;

        return cmd;
    }

    private async stopAndRemoveSmartContractDeployer(node: Node) {

        let stopSmartContractContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker stop smart-contract-deployer'`;
        let removeSmartContractContainerCmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'docker rm smart-contract-deployer'`;

        this.logger.info('====== Stoping and Removing smart-contract-deployer container ======');

        try {
            await this.commandExecutor.executeCommand(stopSmartContractContainerCmd);
        } catch (e) {

        }

        try {
            await this.commandExecutor.executeCommand(removeSmartContractContainerCmd);
        } catch (e) {

        }
    }

    private async obtainIPAddressOfEth(vmIpAddress: string, dockerContainerName: string): Promise<string> {

        let cmd: string = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${vmIpAddress} "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${dockerContainerName}_bc"`;

        let ipAddrs = await this.commandExecutor.executeCommand(cmd);

        ipAddrs = ipAddrs.substring(0, ipAddrs.length - 1); // removing \n at the end
        ipAddrs = ipAddrs + ':8545';


        return ipAddrs;
    }

}