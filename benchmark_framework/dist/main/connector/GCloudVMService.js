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
const Compute = require("@google-cloud/compute");
class GCloudVMService {
    constructor(logger, commandExecutor, config) {
        this.logger = logger;
        this.commandExecutor = commandExecutor;
        this.config = config;
        this.compute = new Compute({
            projectId: config.infrastructureProvider.projectId,
            keyFilename: config.infrastructureProvider.serviceAccountKeyFilename
        });
        this.zone = this.compute.zone(config.infrastructureProvider.zoneName);
    }
    /**
     * Creates and starts a VM at the provider
     * @param vmConfiguration
     * @param caption
     */
    createAndStartVM(vmConfiguration, caption) {
        return __awaiter(this, void 0, void 0, function* () {
            let vmName = '';
            if (caption) {
                vmName = caption + '-';
            }
            vmName = vmName + this.makeid(7);
            const config = {
                disks: [
                    {
                        autoDelete: true,
                        boot: true,
                        initializeParams: {
                            sourceImage: 'projects/ubuntu-os-cloud/global/images/family/ubuntu-1804-lts',
                            diskSizeGb: `${vmConfiguration.storageSSD}`,
                            diskType: `zones/${this.config.infrastructureProvider.zoneName}/diskTypes/pd-ssd`
                        }
                    }
                ],
                http: true,
                machineType: `custom-${vmConfiguration.vCPUcount}-${vmConfiguration.memory * 1024}`,
                networkInterfaces: [
                    {
                        network: 'global/networks/default',
                    },
                ],
            };
            let createVMData = yield this.zone.createVM(vmName, config);
            let operation = createVMData[1];
            return new Promise((resolve, reject) => {
                operation.on('complete', (metadata) => __awaiter(this, void 0, void 0, function* () {
                    operation.removeAllListeners();
                    let hostMachine = {
                        configuration: vmConfiguration,
                        name: vmName,
                        ipAddress: yield this.getVMIPAddress(vmName)
                    };
                    yield this.resetSSHKeyGenForHost(hostMachine.ipAddress);
                    this.logger.info('Created VM ' + JSON.stringify(hostMachine, null, 4));
                    resolve(hostMachine);
                }));
                operation.on('error', (err) => {
                    operation.removeAllListeners();
                    reject('Error when creating vm ' + err);
                });
            });
        });
    }
    startVM(vmName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(' Starting VirtualMachine: ' + vmName);
            const vm = this.zone.vm(vmName);
            let data = yield vm.start();
            let operation = data[0];
            return new Promise((resolve, reject) => {
                operation.on('complete', (metadata) => __awaiter(this, void 0, void 0, function* () {
                    operation.removeAllListeners();
                    let ipAddress = yield this.getVMIPAddress(vmName);
                    yield this.resetSSHKeyGenForHost(ipAddress);
                    resolve(ipAddress);
                }));
                operation.on('error', (err) => {
                    operation.removeAllListeners();
                    reject('error when starting vm');
                });
            });
        });
    }
    stopVM(vmName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Stopping VirtualMachine : ' + vmName);
            const vm = this.zone.vm(vmName);
            let data = vm.stop();
            let operation = data[0];
            return new Promise((resolve, reject) => {
                operation.on('complete', (metadata) => __awaiter(this, void 0, void 0, function* () {
                    operation.removeAllListeners();
                    resolve();
                }));
                operation.on('error', (err) => {
                    operation.removeAllListeners();
                    reject('error when stopping vm');
                });
            });
        });
    }
    getVM(vmName) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const vm = this.zone.vm(vmName);
            const disk = this.zone.disk(vmName);
            let data = yield vm.getMetadata();
            const vmMetadata = data[0];
            let ipAddress = null;
            if (vmMetadata.networkInterfaces[0].accessConfigs[0].natIP) {
                ipAddress = vmMetadata.networkInterfaces[0].accessConfigs[0].natIP;
            }
            let machineType = vmMetadata.machineType;
            let machineTypeNameBeginIndex = machineType.lastIndexOf('/') + 1;
            let machineTypeName = machineType.substring(machineTypeNameBeginIndex);
            machineTypeName = machineTypeName.substring(7);
            let vCPUcountEndIndex = machineTypeName.indexOf('-');
            let ramSizeBeginIndex = vCPUcountEndIndex + 1;
            let vCPUcount = +machineTypeName.substring(0, vCPUcountEndIndex);
            let ramSizeInMB = +machineTypeName.substring(ramSizeBeginIndex, machineTypeName.length);
            data = yield disk.getMetadata();
            const diskMetadata = data[0];
            let diskSizeInGB = +diskMetadata.sizeGb;
            let srcImage = diskMetadata.sourceImage;
            let osName = srcImage.substring(srcImage.lastIndexOf('/') + 1);
            // TODO if used disk is HDD not SSD
            let hostMachine = {
                name: vmName,
                ipAddress: ipAddress,
                configuration: {
                    memory: ramSizeInMB / 1024,
                    vCPUcount: vCPUcount,
                    storageSSD: diskSizeInGB,
                    storageHDD: 0,
                    provider: 'Google Cloud Platform',
                    name: vmName,
                    os: osName
                }
            };
            resolve(hostMachine);
        }));
    }
    findAvailableVMs() {
        return __awaiter(this, void 0, void 0, function* () {
            let hostMachines = [];
            let data = yield this.zone.getVMs();
            let vms = data[0];
            for (let vm of vms) {
                let vmName = vm.name;
                let hostMachine = yield this.getVM(vmName);
                hostMachines.push(hostMachine);
            }
            return hostMachines;
        });
    }
    getVMIPAddress(vmName) {
        return __awaiter(this, void 0, void 0, function* () {
            const vm = this.zone.vm(vmName);
            let data = yield vm.getMetadata();
            let metadata = data[0];
            let ipAddress = metadata.networkInterfaces[0].accessConfigs[0].natIP;
            return ipAddress;
        });
    }
    resetSSHKeyGenForHost(ipAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sleep(20000);
            try {
                yield this.commandExecutor.executeCommand(`ssh-keygen -R "${ipAddress}"`);
            }
            catch (e) {
                this.logger.info('Error when removing host from known hosts ' + e.message);
            }
            yield this.sleep(20000);
            yield this.commandExecutor.executeCommand(`ssh-keyscan -Ht rsa ${ipAddress} >> ~/.ssh/known_hosts`); //adding the host to known hosts
        });
    }
    makeid(length) {
        var text = "";
        var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.GCloudVMService = GCloudVMService;
//# sourceMappingURL=GCloudVMService.js.map