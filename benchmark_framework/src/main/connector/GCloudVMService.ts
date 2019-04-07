import {Logger} from "log4js";
import {CommandExecutor} from "../util/CommandExecutor";
import {Configuration, ContainerConfiguration, HostMachine, ICloudVMService} from "../types";
import * as Compute from '@google-cloud/compute'


export class GCloudVMService implements ICloudVMService {


    private compute;
    private zone;
    private vm;

    constructor(private logger: Logger, private commandExecutor: CommandExecutor, private config: Configuration) {

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
    async createAndStartVM(vmConfiguration: ContainerConfiguration, caption?: string): Promise<HostMachine> {

        let vmName: string = '';
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


        let createVMData = await this.zone.createVM(vmName, config);
        let operation = createVMData[1];

        return new Promise<HostMachine>((resolve, reject) => {

            operation.on('complete', async (metadata) => {
                operation.removeAllListeners();

                let hostMachine: HostMachine = {
                    configuration: vmConfiguration,
                    name: vmName,
                    ipAddress: await this.getVMIPAddress(vmName)
                };
                await this.resetSSHKeyGenForHost(hostMachine.ipAddress);
                this.logger.info('Created VM ' + JSON.stringify(hostMachine, null, 4));

                resolve(hostMachine);
            });
            operation.on('error',  (err) => {
                operation.removeAllListeners();
                reject('Error when creating vm ' + err);
            });
        });

    }

    async startVM(vmName: string): Promise<string> {

        this.logger.info(' Starting VirtualMachine: ' + vmName);

        const vm = this.zone.vm(vmName);
        let data = await vm.start();
        let operation = data[0];

        return new Promise<string>((resolve, reject) => {

            operation.on('complete', async (metadata) => {
                operation.removeAllListeners();
                let ipAddress: string = await this.getVMIPAddress(vmName);
                await this.resetSSHKeyGenForHost(ipAddress);
                resolve(ipAddress);
            });

            operation.on('error', (err) => {
                operation.removeAllListeners();
                reject('error when starting vm');
            });

        });
    }

    async stopVM(vmName: string): Promise<any> {

        this.logger.info('Stopping VirtualMachine : ' + vmName);

        const vm = this.zone.vm(vmName);

        let data = vm.stop();
        let operation = data[0];

        return new Promise<any>( (resolve, reject) => {

            operation.on('complete', async (metadata) => {
                operation.removeAllListeners();
                resolve();
            });

            operation.on('error', (err) => {
                operation.removeAllListeners();
                reject('error when stopping vm');
            });

        });
    }

    getVM(vmName: string): Promise<HostMachine> {


        return new Promise<any>(async (resolve, reject) => {

            const vm = this.zone.vm(vmName);
            const disk = this.zone.disk(vmName);

            let data = await vm.getMetadata();
            const vmMetadata = data[0];

            let ipAddress: string = null;
            if (vmMetadata.networkInterfaces[0].accessConfigs[0].natIP) {
                ipAddress = vmMetadata.networkInterfaces[0].accessConfigs[0].natIP;
            }

            let machineType: string = vmMetadata.machineType;

            let machineTypeNameBeginIndex: number = machineType.lastIndexOf('/') + 1;
            let machineTypeName: string = machineType.substring(machineTypeNameBeginIndex);
            machineTypeName = machineTypeName.substring(7);
            let vCPUcountEndIndex: number = machineTypeName.indexOf('-');
            let ramSizeBeginIndex: number = vCPUcountEndIndex + 1;

            let vCPUcount: number = +machineTypeName.substring(0, vCPUcountEndIndex);
            let ramSizeInMB: number = +machineTypeName.substring(ramSizeBeginIndex, machineTypeName.length);


            data = await disk.getMetadata();
            const diskMetadata = data[0];

            let diskSizeInGB: number = +diskMetadata.sizeGb;

            let srcImage: string = diskMetadata.sourceImage;

            let osName: string = srcImage.substring(srcImage.lastIndexOf('/') + 1);

            // TODO if used disk is HDD not SSD
            let hostMachine: HostMachine = {
                name: vmName,
                ipAddress: ipAddress,
                configuration: {
                    memory: ramSizeInMB/1024,
                    vCPUcount: vCPUcount,
                    storageSSD: diskSizeInGB,
                    storageHDD: 0,
                    provider: 'Google Cloud Platform',
                    name: vmName,
                    os: osName
                }
            };

            resolve(hostMachine);

        });

    }


    async findAvailableVMs(): Promise<HostMachine[]> {

        let hostMachines: HostMachine[] = [];

        let data = await this.zone.getVMs();
        let vms = data[0];

        for (let vm of vms) {
            let vmName: string = vm.name;
            let hostMachine: HostMachine = await this.getVM(vmName);
            hostMachines.push(hostMachine);
        }

        return hostMachines;

    }

    private async getVMIPAddress(vmName: string): Promise<string> {
        const vm = this.zone.vm(vmName);
        let data = await vm.getMetadata();
        let metadata = data[0];
        let ipAddress: string = metadata.networkInterfaces[0].accessConfigs[0].natIP;
        return ipAddress;
    }

    private async resetSSHKeyGenForHost(ipAddress: string) {
        await this.sleep(20000);
        try {
            await this.commandExecutor.executeCommand(`ssh-keygen -R "${ipAddress}"`);
        } catch (e) {
            this.logger.info('Error when removing host from known hosts ' + e.message);
        }
        await this.sleep(20000);
        await this.commandExecutor.executeCommand(`ssh-keyscan -Ht rsa ${ipAddress} >> ~/.ssh/known_hosts`);//adding the host to known hosts
    }

    private makeid(length): string {
        var text = "";
        var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


}