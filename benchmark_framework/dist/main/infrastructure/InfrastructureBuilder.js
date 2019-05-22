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
const types_1 = require("../types");
class InfrastructureBuilder {
    constructor(vmService, logger, commandExecutor, config) {
        this.vmService = vmService;
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.config = config;
        this.visitedNode = {};
        this.visitedHost = {};
        this.notResponsiveVMsNames = [];
    }
    startMachinesOfTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('=== Starting machines of a topology ===');
            this.visitedNode = {};
            this.visitedHost = {};
            yield this.startMachineOfNode(topology.structure);
            return topology;
        });
    }
    startMachineOfNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[node.name]) {
                return;
            }
            this.visitedNode[node.name] = true;
            if (!node.hostMachine.ipAddress) { // if a node's host machine has an ip-address, it means we already have an available machine for the node.
                if (!this.visitedHost[node.hostMachine.name]) {
                    let ipAddress = yield this.vmService.startVM(node.hostMachine.name);
                    node.hostMachine.ipAddress = ipAddress;
                    this.visitedHost[node.hostMachine.name] = ipAddress;
                }
                else {
                    node.hostMachine.ipAddress = this.visitedHost[node.hostMachine.name];
                }
            }
            for (let connection of node.connections) {
                let peer = connection.connectionEndpoint;
                yield this.startMachineOfNode(peer);
            }
        });
    }
    stopMachinesOfTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('=== Stopping machines of a topology ===');
            this.visitedNode = {};
            this.visitedHost = {};
            yield this.stopMachineOfNode(topology.structure);
            return topology;
        });
    }
    stopMachineOfNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[node.name]) {
                return;
            }
            this.visitedNode[node.name] = true;
            if (!this.visitedHost[node.hostMachine.ipAddress]) {
                this.visitedHost[node.hostMachine.ipAddress] = true;
                try {
                    yield this.vmService.stopVM(node.hostMachine.name); // in case the hostMachine isn't a vm by the provider, then the VMService will generate an exception
                }
                catch (e) {
                }
            }
            for (let connection of node.connections) {
                yield this.stopMachineOfNode(connection.connectionEndpoint);
            }
        });
    }
    restartNotResponsiveVMsOfTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.visitedNode = {};
            this.visitedHost = {};
            this.notResponsiveVMsNames = [];
            yield this.restartNotResponsiveVMsRec(topology);
            return this.notResponsiveVMsNames;
        });
    }
    restartNotResponsiveVMsRec(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visitedNode[topology.name]) {
                return;
            }
            this.visitedNode[topology.name] = true;
            if (!this.visitedHost[topology.hostMachine.name]) {
                this.visitedHost[topology.hostMachine.name] = true;
                let isResponsive = yield this.isVMResponsive(topology);
                if (!isResponsive) {
                    yield this.restartVM(topology);
                    this.notResponsiveVMsNames.push(topology.name);
                }
            }
            for (let connection of topology.connections) {
                let peer = connection.connectionEndpoint;
                yield this.restartNotResponsiveVMsRec(peer);
            }
        });
    }
    restartVM(vm) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Restarting VirtualMachine: ' + vm.hostMachine.name);
            yield this.vmService.stopVM(vm.hostMachine.name);
            let ipAddress = yield this.vmService.startVM(vm.hostMachine.name);
            vm.hostMachine.ipAddress = ipAddress;
        });
    }
    createAndStartMachinesOfTopology(topology) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('=== Creating necessary virtual machines for a topology === ');
            let hostMachines = yield this.vmService.findAvailableVMs();
            let vehContainerReqs = this.buildContainerRequirementsForNodeType(topology.structure, types_1.NodeType.vehicle);
            let rsuContainerReqs = this.buildContainerRequirementsForNodeType(topology.structure, types_1.NodeType.rsu);
            let edgeContainerReqs = this.buildContainerRequirementsForNodeType(topology.structure, types_1.NodeType.edge);
            let cloudContainerReqs = this.buildContainerRequirementsForNodeType(topology.structure, types_1.NodeType.cloud);
            let veh, rsu, edge, cloud;
            for (let hostMachine of hostMachines) {
                if (!veh && this.equalRequirements(hostMachine.configuration, vehContainerReqs)) {
                    this.logger.info(`>>> Virtual Machine ${hostMachine.name} will be reused for vehicles`);
                    hostMachine.ipAddress = yield this.vmService.startVM(hostMachine.name);
                    this.updateHostMachinesInTopology(topology.structure, hostMachine, types_1.NodeType.vehicle);
                    veh = true;
                }
                else if (!rsu && this.equalRequirements(hostMachine.configuration, rsuContainerReqs)) {
                    this.logger.info(`>>> Virtual Machine ${hostMachine.name} will be reused for rsus`);
                    hostMachine.ipAddress = yield this.vmService.startVM(hostMachine.name);
                    this.updateHostMachinesInTopology(topology.structure, hostMachine, types_1.NodeType.rsu);
                    rsu = true;
                }
                else if (!edge && this.equalRequirements(hostMachine.configuration, edgeContainerReqs)) {
                    this.logger.info(`>>> Virtual Machine ${hostMachine.name} will be reused for edges`);
                    hostMachine.ipAddress = yield this.vmService.startVM(hostMachine.name);
                    this.updateHostMachinesInTopology(topology.structure, hostMachine, types_1.NodeType.edge);
                    edge = true;
                }
                else if (!cloud && this.equalRequirements(hostMachine.configuration, cloudContainerReqs)) {
                    this.logger.info(`>>> Virtual Machine ${hostMachine.name} will be reused for cloud`);
                    hostMachine.ipAddress = yield this.vmService.startVM(hostMachine.name);
                    this.updateHostMachinesInTopology(topology.structure, hostMachine, types_1.NodeType.cloud);
                    cloud = true;
                }
            }
            if (vehContainerReqs && !veh) {
                this.logger.info('>>> Machine for vehicles need to be created');
                let machine = yield this.vmService.createAndStartVM(vehContainerReqs, 'vehicle-fleet');
                this.updateHostMachinesInTopology(topology.structure, machine, types_1.NodeType.vehicle);
            }
            if (rsuContainerReqs && !rsu) {
                this.logger.info('>>> Machine for rsus need to be created');
                let machine = yield this.vmService.createAndStartVM(rsuContainerReqs, 'rsu-nodes');
                this.updateHostMachinesInTopology(topology.structure, machine, types_1.NodeType.rsu);
            }
            if (edgeContainerReqs && !edge) {
                this.logger.info('>>> Machine for edges need to be created');
                let machine = yield this.vmService.createAndStartVM(edgeContainerReqs, 'edge-nodes');
                this.updateHostMachinesInTopology(topology.structure, machine, types_1.NodeType.edge);
            }
            if (cloudContainerReqs && !cloud) {
                this.logger.info('>>> Machine for cloud need to be created');
                let machine = yield this.vmService.createAndStartVM(cloudContainerReqs, ' cloud-nodes');
                this.updateHostMachinesInTopology(topology.structure, machine, types_1.NodeType.cloud);
            }
            return topology;
        });
    }
    equalRequirements(contA, contB) {
        if (!contA || !contB) {
            return false;
        }
        return contA.vCPUcount == contB.vCPUcount && contA.memory == contB.memory && contA.storageSSD == contB.storageSSD && contA.storageHDD == contB.storageHDD;
    }
    updateHostMachinesInTopology(node, host, nodeType) {
        this.visitedNode = {};
        this.updateHostMachinesInTopologyRec(node, host, nodeType);
    }
    updateHostMachinesInTopologyRec(node, host, nodeType) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;
        if (node.nodeType == nodeType && node.hostMachine.ipAddress == null) {
            node.hostMachine.ipAddress = host.ipAddress;
            node.hostMachine.name = host.name;
        }
        for (let connection of node.connections) {
            let peer = connection.connectionEndpoint;
            this.updateHostMachinesInTopologyRec(peer, host, nodeType);
        }
    }
    buildContainerRequirementsForNodeType(node, nodeType) {
        this.visitedNode = {};
        this.containerRequirements = null;
        this.buildContainerRequirementsForNodeTypeRec(node, nodeType);
        return this.containerRequirements;
    }
    buildContainerRequirementsForNodeTypeRec(node, nodeType) {
        if (this.visitedNode[node.name]) {
            return;
        }
        this.visitedNode[node.name] = true;
        if (node.nodeType == nodeType && node.hostMachine.ipAddress == null) { // build requirements, only for those machines, which dont have an ipaddress, these represent the ones we have to create in cloud
            if (this.containerRequirements) {
                this.containerRequirements.storageHDD = this.containerRequirements.storageHDD + node.hostMachine.configuration.storageHDD;
                this.containerRequirements.storageSSD = this.containerRequirements.storageSSD + node.hostMachine.configuration.storageSSD;
                this.containerRequirements.memory = this.containerRequirements.memory + node.hostMachine.configuration.memory;
                this.containerRequirements.vCPUcount = this.containerRequirements.vCPUcount + node.hostMachine.configuration.vCPUcount;
            }
            else {
                this.containerRequirements = {
                    os: node.hostMachine.configuration.os,
                    storageHDD: node.hostMachine.configuration.storageHDD,
                    storageSSD: node.hostMachine.configuration.storageSSD,
                    memory: node.hostMachine.configuration.memory,
                    vCPUcount: node.hostMachine.configuration.vCPUcount,
                    name: node.hostMachine.configuration.name,
                    provider: node.hostMachine.configuration.provider
                };
            }
        }
        for (let connection of node.connections) {
            let peer = connection.connectionEndpoint;
            this.buildContainerRequirementsForNodeTypeRec(peer, nodeType);
        }
    }
    isVMResponsive(container) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`>>>Checking if ${container.hostMachine.name} is responsive...`);
            let cmd = `ssh -i ${this.config.sshKeyPath} ${this.config.sshUsername}@${container.hostMachine.ipAddress} 'echo "I AM ALIVE"'`;
            try {
                yield this.commandExecutor.executeCommandWithTimeout(cmd, 60 * 1000);
                return true;
            }
            catch (e) {
                return false; // this is most likely because of the timeout
            }
        });
    }
}
exports.InfrastructureBuilder = InfrastructureBuilder;
//# sourceMappingURL=InfrastructureBuilder.js.map