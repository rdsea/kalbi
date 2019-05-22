"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InvalidConfigurationException_1 = require("../exception/InvalidConfigurationException");
const types_1 = require("../types");
class ConfigurationValidation {
    constructor(logger) {
        this.logger = logger;
    }
    checkConfig(config) {
        if (!config) {
            throw new InvalidConfigurationException_1.InvalidConfigurationException('Configuration is null');
        }
        if (!config.resultsDir) {
            throw new InvalidConfigurationException_1.InvalidConfigurationException('resultsDir field is missing in Configuration');
        }
        if (config.infrastructureProvider) {
            if (!config.infrastructureProvider.serviceAccountKeyFilename) {
                throw new InvalidConfigurationException_1.InvalidConfigurationException('ServiceAccountKeyFilename field is missing in Configuration');
            }
            if (!config.infrastructureProvider.projectId) {
                throw new InvalidConfigurationException_1.InvalidConfigurationException('ProjectId field is missing in Configuration');
            }
            if (config.infrastructureProvider.name != 'Google Cloud Platform') {
                this.logger.warn('You provided an invalid name of infrastructure provider, the only supported right now is: Google Cloud Platform');
                config.infrastructureProvider.name = 'Google Cloud Platform';
            }
            if (!config.infrastructureProvider.zoneName) {
                throw new InvalidConfigurationException_1.InvalidConfigurationException('ZoneName field is missing in Configuration');
            }
        }
    }
    checkExperimentsConfiguration(expsConfig) {
        // TODO check regex
        if (!expsConfig.name) {
            throw new InvalidConfigurationException_1.InvalidConfigurationException('Name has to be provided in experiments configuration');
        }
        if (!expsConfig.workloadEmulator) {
            this.logger.warn('WorkloadEmulator is missing in Experiments Configuration, using the default one');
            expsConfig.workloadEmulator = {
                type: 'docker',
                imageTag: 'filiprydzi/v2x_communication'
            };
        }
        if (expsConfig.workloadEmulator.type != 'docker') {
            throw new InvalidConfigurationException_1.InvalidConfigurationException(`${expsConfig.workloadEmulator.type} is a not supported workloadEmulator type`);
        }
        if (!expsConfig.workloadEmulator.imageTag) {
            throw new InvalidConfigurationException_1.InvalidConfigurationException(`Image tag is missing in workload emulator`);
        }
        if (expsConfig.bcImplementations && expsConfig.bcImplementations.length > 0) {
            if (!expsConfig.bcDeployments || expsConfig.bcDeployments.length == 0) {
                throw new InvalidConfigurationException_1.InvalidConfigurationException(`Both or none of bcImplementations, bcDeployments fields have to be provided.`);
            }
            for (let i = 0; i < expsConfig.bcImplementations.length; i++) {
                let bcImplStr = expsConfig.bcImplementations[i].toString();
                bcImplStr = bcImplStr;
                expsConfig.bcImplementations[i] = types_1.BlockchainImpl[bcImplStr];
                let bcImpl = expsConfig.bcImplementations[i];
                if (!bcImpl && bcImpl != 0) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`${bcImplStr} is a non support option for bcImplementations field`);
                }
            }
        }
        if (expsConfig.bcDeployments && expsConfig.bcDeployments.length > 0) {
            if (!expsConfig.bcImplementations || expsConfig.bcImplementations.length == 0) {
                throw new InvalidConfigurationException_1.InvalidConfigurationException(`Both or none of bcImplementations, bcDeployments fields have to be provided.`);
            }
            for (let deployment of expsConfig.bcDeployments) {
                if (!deployment.id && deployment.id != 0) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException('id is missing in deployment field');
                }
                for (let mapping of deployment.featuresMapping) {
                    let featureStr = mapping.feature.toString();
                    featureStr = featureStr;
                    mapping.feature = types_1.BlockchainRole[featureStr];
                    if (!mapping.feature && mapping.feature != 0) {
                        throw new InvalidConfigurationException_1.InvalidConfigurationException(`${featureStr} is an invalid blockchain operation`);
                    }
                    let nodeTypeStr = mapping.nodeType.toString();
                    nodeTypeStr = nodeTypeStr;
                    mapping.nodeType = types_1.NodeType[nodeTypeStr];
                    if (!mapping.nodeType && mapping.nodeType != 0) {
                        throw new InvalidConfigurationException_1.InvalidConfigurationException(`${nodeTypeStr} is an invalid nodeType`);
                    }
                }
            }
        }
        if (expsConfig.vehicleContainerConfigurations) {
            for (let vehConfiguration of expsConfig.vehicleContainerConfigurations) {
                if (!vehConfiguration.name) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`name is missing in container configuration`);
                }
                if (!vehConfiguration.storageHDD && vehConfiguration.storageHDD != 0) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`storageHDD is invalid in ${vehConfiguration.name} container configuration`);
                }
                if (!vehConfiguration.storageSSD && vehConfiguration.storageSSD != 0) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`storageSSD is invalid in ${vehConfiguration.name} container configuration`);
                }
                if (!vehConfiguration.memory || vehConfiguration.memory <= 0) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`memory is invalid in ${vehConfiguration.name} container configuration`);
                }
                if (!vehConfiguration.vCPUcount || vehConfiguration.vCPUcount <= 0) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`vCPUcount is invalid in ${vehConfiguration.name} container configuration`);
                }
            }
        }
        if (expsConfig.networkQualities) {
            for (let networkQuality of expsConfig.networkQualities) {
                if (!networkQuality.name) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`name is missing in network quality`);
                }
                if (!networkQuality.latency) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`latency is missing in ${networkQuality.name} container configuration`);
                }
                if (!networkQuality.bandwidth) {
                    throw new InvalidConfigurationException_1.InvalidConfigurationException(`latency is missing in ${networkQuality.bandwidth} container configuration`);
                }
            }
        }
    }
}
exports.ConfigurationValidation = ConfigurationValidation;
//# sourceMappingURL=ConfigurationValidation.js.map