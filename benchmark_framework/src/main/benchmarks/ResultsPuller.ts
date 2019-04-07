import {Logger} from "log4js";
import {Configuration, Experiment, Node, NodeType} from "../types";
import {CommandExecutor} from "../util/CommandExecutor";
import * as fs from "fs";


export class ResultsPuller {

    private visitedNode = {};
    private visitedContainer = {};

    constructor(private logger: Logger, private commandExecutor: CommandExecutor, private config: Configuration) {

    }

    private async moveAndRenameVehicleSimulationLogs(experiment: Experiment) {
        // rename analysis results
        let files = fs.readdirSync('vehicle_logs');

        files.forEach( async (filename) => {
            let filenamePrefix = `exp-id_${experiment.id}-name_${experiment.name}`;
            let targetFilename: string = `${this.config.resultsDir}/emulated_vehicles_logs/${filenamePrefix}-${filename}`;

            if (!fs.existsSync(`${this.config.resultsDir}/emulated_vehicles_logs`)) {
                await this.commandExecutor.executeCommand(`mkdir -p ${this.config.resultsDir}/emulated_vehicles_logs`);
            }

            if (fs.existsSync(targetFilename)) {// if there is something from previous simulation
                fs.unlinkSync(targetFilename);
            }
            fs.renameSync(`vehicle_logs/${filename}`, targetFilename);
        });
    }


    public async pullLogsAndResultsOfExperiment(experiment: Experiment) {

        this.logger.info('====== Obtaining results of the simulations ======');

        this.visitedNode = {};
        this.visitedContainer = {};
        await this.copyLogsFromVMToHere(experiment.topology.structure);
        
        await this.moveAndRenameVehicleSimulationLogs(experiment);
    }
    

    private async copyLogsFromVMToHere(node: Node) {

        if (this.visitedNode[node.name]) {
            return;
        }

        this.visitedNode[node.name] = true;

        if (!this.visitedContainer[node.hostMachine.name]) {
            this.visitedContainer[node.hostMachine.name] = true;

            await this.copyLogsFromVM(node);
            await this.removeLogsFromVM(node);

            await this.copyResultsFromVM(node);
            await this.removeResultsFromVM(node);
        }

        for (let connection of node.connections) {
            let peer: Node = connection.connectionEndpoint;
            await this.copyLogsFromVMToHere(peer);
        }

    }

    private async copyLogsFromVM(node: Node) {

        if (node.nodeType != NodeType.vehicle) { // we have logs only in vehicles
            return;
        }

        this.logger.info(`====== Copying logs from ${node.hostMachine.name}`);

        let cmdCopyLog = `scp -r -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress}:~/logs/* vehicle_logs/`;

        try {
            await this.commandExecutor.executeCommand(cmdCopyLog);
        } catch (e) {// if there is no log
            this.logger.info(e.name + ' ' + e.message);
        }

    }

    private async copyResultsFromVM(node: Node) {

        if (node.nodeType != NodeType.vehicle) { // simulations are done only at vehicles
            return;
        }

        this.logger.info(`====== Copying simulation results from ${node.hostMachine.name}`);

        let cmdCopyResults = `scp -r -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress}:~/sim-results/* results/`;

        try {
            await this.commandExecutor.executeCommand(cmdCopyResults);
        } catch (e) {// if there is no log
            this.logger.info(e.name + ' ' + e.message);
        }

    }


    private async removeLogsFromVM(node: Node) {

        if (node.nodeType != NodeType.vehicle) { // we have logs only in vehicles
            return;
        }

        this.logger.info(`====== Removing logs in ${node.hostMachine.name}`);

        let cmdRemoveLogs = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'sudo rm -rf ~/logs'`;

        try {
            await this.commandExecutor.executeCommand(cmdRemoveLogs); // if there is no log
        } catch (e) {
            this.logger.info(e.name + ' ' + e.message);
        }

    }


    private async removeResultsFromVM(node: Node) {

        if (node.nodeType != NodeType.vehicle) { // simulations are done only at vehicles
            return;
        }

        this.logger.info(`====== Removing results in ${node.hostMachine.name}`);

        let cmdRemoveResults = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${node.hostMachine.ipAddress} 'sudo rm -rf ~/sim-results'`;

        try {
            await this.commandExecutor.executeCommand(cmdRemoveResults); // if there is no log
        } catch (e) {
            this.logger.info(e.name + ' ' + e.message);
        }

    }


}