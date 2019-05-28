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
class DeploymentPatternEndpoint {
    constructor(deploymentPatternService, logger) {
        this.deploymentPatternService = deploymentPatternService;
        this.logger = logger;
    }
    routes(app) {
        app.route('/dep_pattern')
            .post((req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                let newDepPatt = req.body;
                newDepPatt = yield this.deploymentPatternService.create(newDepPatt);
                res.status(200).send(newDepPatt);
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
        app.route('/dep_pattern')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            res.status(200).send(yield this.deploymentPatternService.readAll());
        }));
        app.route('/dep_pattern/:id')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            res.status(200).send(yield this.deploymentPatternService.readOne(id));
        }));
        app.route('/dep_pattern/:id')
            .delete((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            yield this.deploymentPatternService.delete(id);
            res.status(200).send('Deleted');
        }));
    }
}
exports.DeploymentPatternEndpoint = DeploymentPatternEndpoint;
//# sourceMappingURL=DeploymentPatternEndpoint.js.map