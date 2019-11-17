import * as log4js from "log4js";
import {Logger} from "log4js";
import * as yaml from 'js-yaml'

import {
    IDeploymentPatternGraphRepository,
    IExperimentRepository, IBenchmarkRepository, IGraphDBAPI,
    INodeStructureRepository,
    ISoftwareArtefactsRepository,
    ITopologyRepository,
    IContainerRepository
} from "./repository/interfaces";
import {NodeStructureRepository} from "./repository/NodeStructureRepository";
import {SoftwareArtefactsRepository} from "./repository/SoftwareArtefactsRepository";
import {TopologyRepository} from "./repository/TopologyRepository";
import {ContainerConfigurationRepository} from "./repository/ContainerConfigurationRepository";
import {
    IDeploymentPatternService,
    IBenchmarkService,
    IExperimentService,
    INodeStructureService,
    ISoftwareArtefactsService, ITopologyService,
    IContainerConfigurationService, IRecommendationService
} from "./service/interfaces";
import {ContainerConfigurationService} from "./service/ContainerConfigurationService";
import {SoftwareArtefactService} from "./service/SoftwareArtefactService";
import {NodeStructureService} from "./service/NodeStructureService";
import {TopologyService} from "./service/TopologyService";
import {ContainerConfigurationEndpoint} from "./endpoints/ContainerConfigurationEndpoint";
import {SoftwareArtefactEndpoint} from "./endpoints/SoftwareArtefactEndpoint";
import {ExperimentRepository} from "./repository/ExperimentRepository";
import {ExperimentService} from "./service/ExperimentService";
import {ExperimentEndpoint} from "./endpoints/ExperimentEndpoint";
import {BenchmarkRepository} from "./repository/BenchmarkRepository";
import {BenchmarkService} from "./service/BenchmarkService";
import {BenchmarkEndpoint} from "./endpoints/BenchmarkEndpoint";
import {DeploymentPatternService} from "./service/DeploymentPatternService";
import {DeploymentPatternEndpoint} from "./endpoints/DeploymentPatternEndpoint";
import {Neo4jAPI} from "./repository/Neo4jAPI";
import {DeploymentPatternGraphRepository} from "./repository/DeploymentPatternGraphRepository";
import {RecommendationService} from "./service/RecommendationService";
import {RecommendationEndpoint} from "./endpoints/RecommendationEndpoint";
import {MongoDb} from "./repository/MongoDb";
import {DeploymentPatternMatcher} from "./service/DeploymentPatternMatcher";
import {Configuration} from "./model/dtos";
import * as fs from "fs";


export class DependencyInjection {

    private logger: Logger;
    private mongoDb: MongoDb;

    private config: Configuration;

    private vmConfigEndpoint: ContainerConfigurationEndpoint;
    private softArtefactsEndpoint: SoftwareArtefactEndpoint;
    private experimentEndpoint: ExperimentEndpoint;
    private expResultEndpoint: BenchmarkEndpoint;
    private depPatternEndpoint: DeploymentPatternEndpoint;
    private recommendationEndpoint: RecommendationEndpoint;

    private deploymentPatternMatcher: DeploymentPatternMatcher;
    private vmService: IContainerConfigurationService;
    private softwareArtefactsService: ISoftwareArtefactsService;
    private nodeStructureService: INodeStructureService;
    private topologyService: ITopologyService;
    private experimentService: IExperimentService;
    private experimentResultService: IBenchmarkService;
    private depPatternService: IDeploymentPatternService;
    private recommendationService: IRecommendationService;

    private nodeStructureRepository: INodeStructureRepository;
    private softwareArtefactsRepository: ISoftwareArtefactsRepository;
    private topologyRepository: ITopologyRepository;
    private vmRepository: IContainerRepository;
    private experimentRepository: IExperimentRepository;
    private experimentResultRepository: IBenchmarkRepository;

    private graphAPI: IGraphDBAPI;
    private depPatternGraphRepo: IDeploymentPatternGraphRepository;


    public createConfigurationWrapper() {
        if (this.config) {
            return this.config;
        }
        this.config = yaml.safeLoad(fs.readFileSync('config/config.yaml').toString());
        return this.config;
    }

    public createDeploymentPatternGraphRepository() {
        if (this.depPatternGraphRepo) {
            return this.depPatternGraphRepo;
        }
        this.depPatternGraphRepo = new DeploymentPatternGraphRepository(this.createGraphAPI(), this.createLogger());
        return this.depPatternGraphRepo;
    }


    public createGraphAPI(): IGraphDBAPI {
        if (this.graphAPI) {
            return this.graphAPI;
        }
        this.graphAPI = new Neo4jAPI(this.createLogger(), this.createConfigurationWrapper());
        return this.graphAPI;
    }

    public createRecommendationEndpoint(): RecommendationEndpoint {
        if (this.recommendationEndpoint) {
            return this.recommendationEndpoint;
        }
        this.recommendationEndpoint = new RecommendationEndpoint(this.createRecommendationService(), this.createLogger());
        return this.recommendationEndpoint;
    }

    public createDeploymentPatternEndpoint(): DeploymentPatternEndpoint {
        if (this.depPatternEndpoint) {
            return this.depPatternEndpoint;
        }
        this.depPatternEndpoint = new DeploymentPatternEndpoint(this.createDeploymentPatternService(), this.createLogger());
        return this.depPatternEndpoint;
    }

    public createBenchmarkEndpoint(): BenchmarkEndpoint {
        if (this.expResultEndpoint) {
            return this.expResultEndpoint;
        }
        this.expResultEndpoint = new BenchmarkEndpoint(this.createBenchmarkService(), this.createLogger());
        return this.expResultEndpoint;
    }

    public createExperimentEndpoint(): ExperimentEndpoint {
        if (this.experimentEndpoint) {
            return this.experimentEndpoint;
        }
        this.experimentEndpoint = new ExperimentEndpoint(this.createExperimentService(), this.createLogger());
        return this.experimentEndpoint;
    }

    public createSoftArtefactsEndpoint(): SoftwareArtefactEndpoint {
        if (this.softArtefactsEndpoint) {
            return this.softArtefactsEndpoint;
        }
        this.softArtefactsEndpoint = new SoftwareArtefactEndpoint(this.createSoftwareArtefactsService(), this.createLogger());
        return this.softArtefactsEndpoint;
    }

    public createVMConfigurationEndpoint(): ContainerConfigurationEndpoint {
        if (this.vmConfigEndpoint) {
            return this.vmConfigEndpoint;
        }
        this.vmConfigEndpoint = new ContainerConfigurationEndpoint(this.createContainerConfigurationService(), this.createLogger());
        return this.vmConfigEndpoint;
    }

    public createContainerConfigurationService(): IContainerConfigurationService {
        if (this.vmService) {
            return this.vmService;
        }
        this.vmService = new ContainerConfigurationService(this.createVMConfigRepository(), this.createLogger());
        return this.vmService;
    }

    public createRecommendationService(): IRecommendationService {
        if (this.recommendationService) {
            return this.recommendationService;
        }
        this.recommendationService = new RecommendationService(this.createDeploymentPatternMatcher(), this.createExperimentService(), this.createLogger());
        return this.recommendationService;
    }

    public createSoftwareArtefactsService(): ISoftwareArtefactsService {
        if (this.softwareArtefactsService) {
            return this.softwareArtefactsService;
        }
        this.softwareArtefactsService = new SoftwareArtefactService(this.createSoftwareArterfactsRepository(), this.createLogger());
        return this.softwareArtefactsService;
    }

    public createBenchmarkService(): IBenchmarkService {
        if (this.experimentResultService) {
            return this.experimentResultService;
        }
        this.experimentResultService = new BenchmarkService(this.createBenchmarkRepository(), this.createLogger());
        return this.experimentResultService;
    }

    public createExperimentService(): IExperimentService {
        if (this.experimentService) {
            return this.experimentService;
        }
        this.experimentService = new ExperimentService(this.createExperimentRepository(), this.createTopologyService(), this.createBenchmarkService(), this.createDeploymentPatternService(), this.createDeploymentPatternMatcher(), this.createLogger());
        return this.experimentService;
    }

    public createDeploymentPatternService(): IDeploymentPatternService {
        if (this.depPatternService) {
            return this.depPatternService;
        }
        this.depPatternService = new DeploymentPatternService(this.createDeploymentPatternGraphRepository(), this.createLogger());
        return this.depPatternService;
    }

    public createNodeStructureService(): INodeStructureService {
        if (this.nodeStructureService) {
            return this.nodeStructureService;
        }
        this.nodeStructureService = new NodeStructureService(this.createNodeStructureRepository(), this.createSoftwareArtefactsService(), this.createContainerConfigurationService(), this.createLogger());
        return this.nodeStructureService;
    }

    public createTopologyService(): ITopologyService {
        if (this.topologyService) {
            return this.topologyService;
        }
        this.topologyService = new TopologyService(this.createTopologyRepository(), this.createNodeStructureService(), this.createLogger());
        return this.topologyService;
    }

    public createExperimentRepository(): IExperimentRepository {
        if (this.experimentRepository) {
            return this.experimentRepository;
        }
        this.experimentRepository = new ExperimentRepository(this.mongoDb, this.createLogger());
        return this.experimentRepository;
    }

    public createBenchmarkRepository(): IBenchmarkRepository {
        if (this.experimentResultRepository) {
            return this.experimentResultRepository;
        }
        this.experimentResultRepository = new BenchmarkRepository(this.mongoDb, this.createLogger());
        return this.experimentResultRepository;
    }

    public createNodeStructureRepository(): INodeStructureRepository {
        if (this.nodeStructureRepository) {
            return this.nodeStructureRepository;
        }
        this.nodeStructureRepository = new NodeStructureRepository(this.mongoDb, this.createLogger());
        return this.nodeStructureRepository;
    }

    public createSoftwareArterfactsRepository(): ISoftwareArtefactsRepository {
        if (this.softwareArtefactsRepository) {
            return this.softwareArtefactsRepository;
        }
        this.softwareArtefactsRepository = new SoftwareArtefactsRepository(this.mongoDb, this.createLogger());
        return this.softwareArtefactsRepository;
    }

    public createTopologyRepository(): ITopologyRepository {
        if (this.topologyRepository) {
            return this.topologyRepository;
        }
        this.topologyRepository = new TopologyRepository(this.mongoDb, this.createLogger());
        return this.topologyRepository;
    }

    public createVMConfigRepository(): IContainerRepository {
        if (this.vmRepository) {
            return this.vmRepository;
        }
        this.vmRepository = new ContainerConfigurationRepository(this.mongoDb, this.createLogger());
        return this.vmRepository;
    }

    public createDeploymentPatternMatcher(): DeploymentPatternMatcher {
        if (this.deploymentPatternMatcher) {
            return this.deploymentPatternMatcher;
        }
        this.deploymentPatternMatcher = new DeploymentPatternMatcher(this.createDeploymentPatternService(), this.createLogger());
        return this.deploymentPatternMatcher;
    }


    public async createMongoDB(): Promise<MongoDb> {
        if (this.mongoDb) {
            return this.mongoDb;
        }
        this.mongoDb = new MongoDb(this.logger, this.createConfigurationWrapper());
        return this.mongoDb;
    }


    public createLogger(): Logger {
        if (this.logger) {
            return this.logger;
        }
        log4js.configure('config/log4js.json');
        this.logger = log4js.getLogger('default');
        return this.logger;
    }
}