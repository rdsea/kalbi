import {Logger} from "log4js";
import {InvalidConfigurationException} from "../exception/InvalidConfigurationException";
import {BlockchainImpl, BlockchainRole, Configuration, ExperimentsConfiguration, ResourceType} from "../types";

export class ConfigurationValidation {

    constructor(private logger: Logger) {

    }

    public checkConfig(config: Configuration) {

        if (!config) {
            throw new InvalidConfigurationException('Configuration is null');
        }

        if (!config.resultsDir) {
            throw new InvalidConfigurationException('resultsDir field is missing in Configuration');
        }

        if (config.infrastructureProvider) {
            if (!config.infrastructureProvider.serviceAccountKeyFilename) {
                throw new InvalidConfigurationException('ServiceAccountKeyFilename field is missing in Configuration');
            }

            if (!config.infrastructureProvider.projectId) {
                throw new InvalidConfigurationException('ProjectId field is missing in Configuration');
            }

            if (config.infrastructureProvider.name != 'Google Cloud Platform') {
                this.logger.warn('You provided an invalid name of infrastructure provider, the only supported right now is: Google Cloud Platform');
                config.infrastructureProvider.name = 'Google Cloud Platform';
            }

            if (!config.infrastructureProvider.zoneName) {
                throw new InvalidConfigurationException('ZoneName field is missing in Configuration');
            }
        }
    }

    public checkExperimentsConfiguration(expsConfig: ExperimentsConfiguration) {
        // TODO check regex
        if (!expsConfig.name) {
            throw new InvalidConfigurationException('Name has to be provided in experiments configuration');
        }

        if (!expsConfig.workloadEmulator) {
            this.logger.warn('WorkloadEmulator is missing in Experiments Configuration, using the default one');
            expsConfig.workloadEmulator = {
                type: 'docker',
                imageTag: 'filiprydzi/v2x_communication'
            };
        }

        if (expsConfig.workloadEmulator.type != 'docker') {
            throw new InvalidConfigurationException(`${expsConfig.workloadEmulator.type} is a not supported workloadEmulator type`);
        }

        if (!expsConfig.workloadEmulator.imageTag) {
            throw new InvalidConfigurationException(`Image tag is missing in workload emulator`);
        }

        if (expsConfig.bcImplementations && expsConfig.bcImplementations.length > 0) {

            if (!expsConfig.bcDeployments || expsConfig.bcDeployments.length == 0) {
                throw new InvalidConfigurationException(`Both or none of bcImplementations, bcDeployments fields have to be provided.`);
            }

            for (let i: number = 0; i < expsConfig.bcImplementations.length; i++) {
                let bcImplStr: string = expsConfig.bcImplementations[i].toString();
                bcImplStr = bcImplStr as keyof BlockchainImpl;
                expsConfig.bcImplementations[i] = BlockchainImpl[bcImplStr];
                let bcImpl = expsConfig.bcImplementations[i];
                if (!bcImpl && bcImpl != 0) {
                    throw new InvalidConfigurationException(`${bcImplStr} is a non support option for bcImplementations field`);
                }
            }
        }

        if (expsConfig.bcDeployments && expsConfig.bcDeployments.length > 0) {

            if (!expsConfig.bcImplementations || expsConfig.bcImplementations.length == 0) {
                throw new InvalidConfigurationException(`Both or none of bcImplementations, bcDeployments fields have to be provided.`);
            }

            for (let deployment of expsConfig.bcDeployments) {
                if (!deployment.id && deployment.id != 0) {
                    throw new InvalidConfigurationException('id is missing in deployment field');
                }
                for (let mapping of deployment.featuresMapping) {
                    let featureStr: string = mapping.feature.toString();
                    featureStr = featureStr as keyof BlockchainRole;
                    mapping.feature = BlockchainRole[featureStr];
                    if (!mapping.feature && mapping.feature != 0) {
                        throw new InvalidConfigurationException(`${featureStr} is an invalid blockchain operation`);
                    }

                    let nodeTypeStr: string = mapping.nodeType.toString();
                    nodeTypeStr = nodeTypeStr as keyof ResourceType;
                    mapping.nodeType = ResourceType[nodeTypeStr];
                    if (!mapping.nodeType && mapping.nodeType != 0) {
                        throw new InvalidConfigurationException(`${nodeTypeStr} is an invalid nodeType`);
                    }
                }
            }
        }

        if (expsConfig.vehicleContainerConfigurations) {
            for (let vehConfiguration of expsConfig.vehicleContainerConfigurations) {
                if (!vehConfiguration.name) {
                    throw new InvalidConfigurationException(`name is missing in container configuration`);
                }
                if (!vehConfiguration.storageHDD && vehConfiguration.storageHDD != 0) {
                    throw new InvalidConfigurationException(`storageHDD is invalid in ${vehConfiguration.name} container configuration`);
                }
                if (!vehConfiguration.storageSSD && vehConfiguration.storageSSD != 0) {
                    throw new InvalidConfigurationException(`storageSSD is invalid in ${vehConfiguration.name} container configuration`);
                }
                if (!vehConfiguration.memory || vehConfiguration.memory <= 0) {
                    throw new InvalidConfigurationException(`memory is invalid in ${vehConfiguration.name} container configuration`);
                }
                if (!vehConfiguration.vCPUcount || vehConfiguration.vCPUcount <= 0) {
                    throw new InvalidConfigurationException(`vCPUcount is invalid in ${vehConfiguration.name} container configuration`);
                }
            }
        }

        if (expsConfig.networkQualities) {
            for (let networkQuality of expsConfig.networkQualities) {
                if (!networkQuality.name) {
                    throw new InvalidConfigurationException(`name is missing in network quality`);
                }
                if (!networkQuality.latency) {
                    throw new InvalidConfigurationException(`latency is missing in ${networkQuality.name} container configuration`);
                }
                if (!networkQuality.bandwidth) {
                    throw new InvalidConfigurationException(`latency is missing in ${networkQuality.bandwidth} container configuration`);
                }
            }
        }


    }

}