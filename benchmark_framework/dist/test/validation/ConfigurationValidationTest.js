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
const types_1 = require("../../main/types");
const log4js = require("log4js");
const ConfigurationValidation_1 = require("../../main/validation/ConfigurationValidation");
const InvalidConfigurationException_1 = require("../../main/exception/InvalidConfigurationException");
const assert = require('assert');
describe('ConfigurationValidation tests', () => {
    log4js.configure('config/log4js.json');
    let logger = log4js.getLogger('default');
    it('checkExperimentsConfigurationShouldOK', () => __awaiter(this, void 0, void 0, function* () {
        let configValidation = new ConfigurationValidation_1.ConfigurationValidation(logger);
        let expsConfig = {
            name: 'example configuration',
            description: 'this is an example experiments configuration file',
            roundsNr: 100,
            workloadEmulator: {
                imageTag: 'repoId/tagId',
                type: 'docker'
            },
            bcImplementations: [
                types_1.BlockchainImpl.hypfab,
                types_1.BlockchainImpl.eth
            ],
            bcDeployments: [
                {
                    id: 0,
                    featuresMapping: [
                        {
                            feature: types_1.BlockchainRole.all,
                            nodeType: types_1.ResourceType.EDGE_SERVICE
                        },
                        {
                            feature: types_1.BlockchainRole.creator,
                            nodeType: types_1.ResourceType.RSU_RESOURCE
                        },
                        {
                            feature: types_1.BlockchainRole.creator,
                            nodeType: types_1.ResourceType.VEHICLE_IOT
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
        }
        catch (e) {
            assert.fail('Exception ' + e);
        }
    }));
    it('checkExperimentsConfigurationShouldThrowConfigurationValidationException', () => __awaiter(this, void 0, void 0, function* () {
        let configValidation = new ConfigurationValidation_1.ConfigurationValidation(logger);
        let invalidExpsConfig = {
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
                            feature: types_1.BlockchainRole.all,
                            nodeType: types_1.ResourceType.EDGE_SERVICE
                        },
                        {
                            feature: types_1.BlockchainRole.creator,
                            nodeType: types_1.ResourceType.RSU_RESOURCE
                        },
                        {
                            feature: types_1.BlockchainRole.creator,
                            nodeType: types_1.ResourceType.VEHICLE_IOT
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
        }
        catch (e) {
            if (e instanceof InvalidConfigurationException_1.InvalidConfigurationException) {
                assert(1);
            }
            else {
                assert.fail('Exception e ' + e);
            }
        }
    }));
});
//# sourceMappingURL=ConfigurationValidationTest.js.map