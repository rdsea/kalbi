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
const log4js = require("log4js");
const NodeStructureRepository_1 = require("./repository/NodeStructureRepository");
const SoftwareArtefactsRepository_1 = require("./repository/SoftwareArtefactsRepository");
const TopologyRepository_1 = require("./repository/TopologyRepository");
const ContainerConfigurationRepository_1 = require("./repository/ContainerConfigurationRepository");
const ContainerConfigurationService_1 = require("./service/ContainerConfigurationService");
const SoftwareArtefactService_1 = require("./service/SoftwareArtefactService");
const NodeStructureService_1 = require("./service/NodeStructureService");
const TopologyService_1 = require("./service/TopologyService");
const ContainerConfigurationEndpoint_1 = require("./endpoints/ContainerConfigurationEndpoint");
const SoftwareArtefactEndpoint_1 = require("./endpoints/SoftwareArtefactEndpoint");
const ExperimentRepository_1 = require("./repository/ExperimentRepository");
const ExperimentService_1 = require("./service/ExperimentService");
const ExperimentEndpoint_1 = require("./endpoints/ExperimentEndpoint");
const BenchmarkRepository_1 = require("./repository/BenchmarkRepository");
const BenchmarkService_1 = require("./service/BenchmarkService");
const BenchmarkEndpoint_1 = require("./endpoints/BenchmarkEndpoint");
const DeploymentPatternService_1 = require("./service/DeploymentPatternService");
const DeploymentPatternEndpoint_1 = require("./endpoints/DeploymentPatternEndpoint");
const Neo4jAPI_1 = require("./repository/Neo4jAPI");
const DeploymentPatternGraphRepository_1 = require("./repository/DeploymentPatternGraphRepository");
const RecommendationService_1 = require("./service/RecommendationService");
const RecommendationEndpoint_1 = require("./endpoints/RecommendationEndpoint");
const MongoDb_1 = require("./repository/MongoDb");
const DeploymentPatternMatcher_1 = require("./service/DeploymentPatternMatcher");
class DependencyInjection {
    createDeploymentPatternGraphRepository() {
        if (this.depPatternGraphRepo) {
            return this.depPatternGraphRepo;
        }
        this.depPatternGraphRepo = new DeploymentPatternGraphRepository_1.DeploymentPatternGraphRepository(this.createGraphAPI(), this.createLogger());
        return this.depPatternGraphRepo;
    }
    createGraphAPI() {
        if (this.graphAPI) {
            return this.graphAPI;
        }
        this.graphAPI = new Neo4jAPI_1.Neo4jAPI(this.createLogger());
        return this.graphAPI;
    }
    createRecommendationEndpoint() {
        if (this.recommendationEndpoint) {
            return this.recommendationEndpoint;
        }
        this.recommendationEndpoint = new RecommendationEndpoint_1.RecommendationEndpoint(this.createRecommendationService(), this.createLogger());
        return this.recommendationEndpoint;
    }
    createDeploymentPatternEndpoint() {
        if (this.depPatternEndpoint) {
            return this.depPatternEndpoint;
        }
        this.depPatternEndpoint = new DeploymentPatternEndpoint_1.DeploymentPatternEndpoint(this.createDeploymentPatternService(), this.createLogger());
        return this.depPatternEndpoint;
    }
    createBenchmarkEndpoint() {
        if (this.expResultEndpoint) {
            return this.expResultEndpoint;
        }
        this.expResultEndpoint = new BenchmarkEndpoint_1.BenchmarkEndpoint(this.createBenchmarkService(), this.createLogger());
        return this.expResultEndpoint;
    }
    createExperimentEndpoint() {
        if (this.experimentEndpoint) {
            return this.experimentEndpoint;
        }
        this.experimentEndpoint = new ExperimentEndpoint_1.ExperimentEndpoint(this.createExperimentService(), this.createLogger());
        return this.experimentEndpoint;
    }
    createSoftArtefactsEndpoint() {
        if (this.softArtefactsEndpoint) {
            return this.softArtefactsEndpoint;
        }
        this.softArtefactsEndpoint = new SoftwareArtefactEndpoint_1.SoftwareArtefactEndpoint(this.createSoftwareArtefactsService(), this.createLogger());
        return this.softArtefactsEndpoint;
    }
    createVMConfigurationEndpoint() {
        if (this.vmConfigEndpoint) {
            return this.vmConfigEndpoint;
        }
        this.vmConfigEndpoint = new ContainerConfigurationEndpoint_1.ContainerConfigurationEndpoint(this.createContainerConfigurationService(), this.createLogger());
        return this.vmConfigEndpoint;
    }
    createContainerConfigurationService() {
        if (this.vmService) {
            return this.vmService;
        }
        this.vmService = new ContainerConfigurationService_1.ContainerConfigurationService(this.createVMConfigRepository(), this.createLogger());
        return this.vmService;
    }
    createRecommendationService() {
        if (this.recommendationService) {
            return this.recommendationService;
        }
        this.recommendationService = new RecommendationService_1.RecommendationService(this.createDeploymentPatternMatcher(), this.createExperimentService(), this.createLogger());
        return this.recommendationService;
    }
    createSoftwareArtefactsService() {
        if (this.softwareArtefactsService) {
            return this.softwareArtefactsService;
        }
        this.softwareArtefactsService = new SoftwareArtefactService_1.SoftwareArtefactService(this.createSoftwareArterfactsRepository(), this.createLogger());
        return this.softwareArtefactsService;
    }
    createBenchmarkService() {
        if (this.experimentResultService) {
            return this.experimentResultService;
        }
        this.experimentResultService = new BenchmarkService_1.BenchmarkService(this.createBenchmarkRepository(), this.createLogger());
        return this.experimentResultService;
    }
    createExperimentService() {
        if (this.experimentService) {
            return this.experimentService;
        }
        this.experimentService = new ExperimentService_1.ExperimentService(this.createExperimentRepository(), this.createTopologyService(), this.createBenchmarkService(), this.createDeploymentPatternService(), this.createLogger());
        return this.experimentService;
    }
    createDeploymentPatternService() {
        if (this.depPatternService) {
            return this.depPatternService;
        }
        this.depPatternService = new DeploymentPatternService_1.DeploymentPatternService(this.createDeploymentPatternGraphRepository(), this.createLogger());
        return this.depPatternService;
    }
    createNodeStructureService() {
        if (this.nodeStructureService) {
            return this.nodeStructureService;
        }
        this.nodeStructureService = new NodeStructureService_1.NodeStructureService(this.createNodeStructureRepository(), this.createSoftwareArtefactsService(), this.createContainerConfigurationService(), this.createLogger());
        return this.nodeStructureService;
    }
    createTopologyService() {
        if (this.topologyService) {
            return this.topologyService;
        }
        this.topologyService = new TopologyService_1.TopologyService(this.createTopologyRepository(), this.createNodeStructureService(), this.createLogger());
        return this.topologyService;
    }
    createExperimentRepository() {
        if (this.experimentRepository) {
            return this.experimentRepository;
        }
        this.experimentRepository = new ExperimentRepository_1.ExperimentRepository(this.mongoDb, this.createLogger());
        return this.experimentRepository;
    }
    createBenchmarkRepository() {
        if (this.experimentResultRepository) {
            return this.experimentResultRepository;
        }
        this.experimentResultRepository = new BenchmarkRepository_1.BenchmarkRepository(this.mongoDb, this.createLogger());
        return this.experimentResultRepository;
    }
    createNodeStructureRepository() {
        if (this.nodeStructureRepository) {
            return this.nodeStructureRepository;
        }
        this.nodeStructureRepository = new NodeStructureRepository_1.NodeStructureRepository(this.mongoDb, this.createLogger());
        return this.nodeStructureRepository;
    }
    createSoftwareArterfactsRepository() {
        if (this.softwareArtefactsRepository) {
            return this.softwareArtefactsRepository;
        }
        this.softwareArtefactsRepository = new SoftwareArtefactsRepository_1.SoftwareArtefactsRepository(this.mongoDb, this.createLogger());
        return this.softwareArtefactsRepository;
    }
    createTopologyRepository() {
        if (this.topologyRepository) {
            return this.topologyRepository;
        }
        this.topologyRepository = new TopologyRepository_1.TopologyRepository(this.mongoDb, this.createLogger());
        return this.topologyRepository;
    }
    createVMConfigRepository() {
        if (this.vmRepository) {
            return this.vmRepository;
        }
        this.vmRepository = new ContainerConfigurationRepository_1.ContainerConfigurationRepository(this.mongoDb, this.createLogger());
        return this.vmRepository;
    }
    createDeploymentPatternMatcher() {
        if (this.deploymentPatternMatcher) {
            return this.deploymentPatternMatcher;
        }
        this.deploymentPatternMatcher = new DeploymentPatternMatcher_1.DeploymentPatternMatcher(this.createDeploymentPatternService(), this.createLogger());
        return this.deploymentPatternMatcher;
    }
    createMongoDB() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mongoDb) {
                return this.mongoDb;
            }
            this.mongoDb = new MongoDb_1.MongoDb(this.logger);
            return this.mongoDb;
        });
    }
    createLogger() {
        if (this.logger) {
            return this.logger;
        }
        log4js.configure('config/log4js.json');
        this.logger = log4js.getLogger('default');
        return this.logger;
    }
}
exports.DependencyInjection = DependencyInjection;
//# sourceMappingURL=DependencyInjection.js.map