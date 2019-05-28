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
class ExperimentEndpoint {
    constructor(experimentService, logger) {
        this.experimentService = experimentService;
        this.logger = logger;
    }
    routes(app) {
        app.route('/experiment')
            .post((req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                let newExp = req.body;
                newExp = yield this.experimentService.create(newExp);
                res.status(200).send(newExp);
            }
            catch (e) {
                if (e instanceof ValidationException_1.ValidationException) {
                    this.logger.info(e);
                    res.status(400).send(e);
                }
                else {
                    this.logger.error(e);
                    res.status(400).send(e);
                }
            }
        }));
        app.route('/experiment')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            res.status(200).send(yield this.experimentService.readAll());
        }));
        app.route('/experiment/:id')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            res.status(200).send(yield this.experimentService.readOne(id));
        }));
        app.route('/experiment/:id')
            .delete((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            yield this.experimentService.delete(id);
            res.status(200).send('Deleted');
        }));
    }
}
exports.ExperimentEndpoint = ExperimentEndpoint;
//# sourceMappingURL=ExperimentEndpoint.js.map