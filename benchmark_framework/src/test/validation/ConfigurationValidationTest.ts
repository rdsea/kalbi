import {BlockchainImpl, BlockchainRole, ExperimentsConfiguration, ResourceType} from "../../main/types";
import * as log4js from "log4js";
import {ConfigurationValidation} from "../../main/validation/ConfigurationValidation";
import {Logger} from "log4js";
import {InvalidConfigurationException} from "../../main/exception/InvalidConfigurationException";

const assert = require('assert');

describe('ConfigurationValidation tests', () => {

    log4js.configure('config/log4js.json');
    let logger: Logger = log4js.getLogger('default');


    it('checkExperimentsConfigurationShouldOK', async () => {

        let configValidation: ConfigurationValidation = new ConfigurationValidation(logger);

        let expsConfig: ExperimentsConfiguration = {
            name: 'example configuration',
            description: 'this is an example experiments configuration file',
            roundsNr: 100,
            workloadEmulator: {
                imageTag: 'repoId/tagId',
                type: 'docker'
            },
            bcImplementations: [
                BlockchainImpl.hypfab,
                BlockchainImpl.eth
            ],
            bcDeployments: [
                {
                    id: 0,
                    featuresMapping: [
                        {
                            feature: BlockchainRole.all,
                            resourceType: ResourceType.EDGE_SERVICE
                        },
                        {
                            feature: BlockchainRole.creator,
                            resourceType: ResourceType.RSU_RESOURCE
                        },
                        {
                            feature: BlockchainRole.creator,
                            resourceType: ResourceType.VEHICLE_IOT
                        }
                    ]
                }
            ],
            networkQualities: [
                {
                    bandwidth: '50Mbps',
                    latency: '5ms',
                    name: '5G'
                },
                {
                    name: '3G',
                    latency: '200ms',
                    bandwidth: '1Mbps'
                }
            ],
            vehicleContainerConfigurations: [
                {
                    vCPUcount: 1,
                    memory: 2,
                    storageSSD: 10,
                    storageHDD: 0,
                    name: 'small',
                    os: 'ubuntu',
                    provider: 'Google Cloud Platform'
                }
            ]
        };
        try {
            configValidation.checkExperimentsConfiguration(expsConfig);
            assert(1);
        } catch (e) {
            assert.fail('Exception ' + e);
        }
    });

    it('checkExperimentsConfigurationShouldThrowConfigurationValidationException', async () => {

        let configValidation: ConfigurationValidation = new ConfigurationValidation(logger);

        let invalidExpsConfig: ExperimentsConfiguration = { // we supplied bcDeployments, but an empty bcImplementations
            name: 'example configuration',
            description: 'this is an example experiments configuration file',
            roundsNr: 100,
            workloadEmulator: {
                imageTag: 'repoId/tagId',
                type: 'docker'
            },
            bcImplementations: [],
            bcDeployments: [
                {
                    id: 0,
                    featuresMapping: [
                        {
                            feature: BlockchainRole.all,
                            resourceType: ResourceType.EDGE_SERVICE
                        },
                        {
                            feature: BlockchainRole.creator,
                            resourceType: ResourceType.RSU_RESOURCE
                        },
                        {
                            feature: BlockchainRole.creator,
                            resourceType: ResourceType.VEHICLE_IOT
                        }
                    ]
                }
            ],
            networkQualities: [
                {
                    bandwidth: '50Mbps',
                    latency: '5ms',
                    name: '5G'
                },
                {
                    name: '3G',
                    latency: '200ms',
                    bandwidth: '1Mbps'
                }
            ],
            vehicleContainerConfigurations: [
                {
                    vCPUcount: 1,
                    memory: 2,
                    storageSSD: 10,
                    storageHDD: 0,
                    name: 'small',
                    os: 'ubuntu',
                    provider: 'Google Cloud Platform'
                }
            ]
        };
        try {
            configValidation.checkExperimentsConfiguration(invalidExpsConfig);
            assert.fail('Should throw InvalidConfigurationException');
        } catch (e) {
            if (e instanceof InvalidConfigurationException) {
                assert(1);
            } else {
                assert.fail('Exception e ' + e);
            }
        }
    });


});