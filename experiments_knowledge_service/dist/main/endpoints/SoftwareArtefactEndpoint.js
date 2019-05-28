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
const ValidationException_1 = require("../validation/ValidationException");
class SoftwareArtefactEndpoint {
    constructor(softArtefactsService, logger) {
        this.softArtefactsService = softArtefactsService;
        this.logger = logger;
    }
    routes(router) {
        router.route('/software_artefact')
            .post((req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.body.implementation) {
                    let bcMetadata = {
                        implementation: req.body.implementation,
                        featureName: req.body.featureName
                    };
                    let newBcArtefact = {
                        name: req.body.name,
                        repositoryTag: req.body.repositoryTag,
                        executionEnvironment: req.body.executionEnvironment,
                        bcMetadata: bcMetadata,
                        _id: null
                    };
                    newBcArtefact = (yield this.softArtefactsService.create(newBcArtefact));
                    res.status(200).send(newBcArtefact);
                }
                else {
                    let newSoftwareArtefact = {
                        name: req.body.name,
                        repositoryTag: req.body.repositoryTag,
                        executionEnvironment: req.body.executionEnvironment,
                        _id: null
                    };
                    newSoftwareArtefact = (yield this.softArtefactsService.create(newSoftwareArtefact));
                    res.status(200).send(newSoftwareArtefact);
                }
            }
            catch (e) {
                if (e instanceof ValidationException_1.ValidationException) {
                    this.logger.info(e);
                    res.status(400).send(e);
                }
                else {
                    throw e;
                }
            }
        }));
        router.route('/software_artefact')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            res.status(200).send(yield this.softArtefactsService.readAll());
        }));
        router.route('/software_artefact/:id')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            res.status(200).send(yield this.softArtefactsService.readOne(id));
        }));
        router.route('/software_artefact/:id')
            .delete((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            yield this.softArtefactsService.delete(id);
            res.status(200).send('Deleted');
        }));
    }
}
exports.SoftwareArtefactEndpoint = SoftwareArtefactEndpoint;
//# sourceMappingURL=SoftwareArtefactEndpoint.js.map