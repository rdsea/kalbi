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
class BenchmarkEndpoint {
    constructor(benchmarkService, logger) {
        this.benchmarkService = benchmarkService;
        this.logger = logger;
    }
    routes(app) {
        app.route('/benchmark')
            .post((req, res) => __awaiter(this, void 0, void 0, function* () {
            let newExpResult = req.body;
            try {
                newExpResult = yield this.benchmarkService.create(newExpResult);
                res.status(200).send(newExpResult);
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
        app.route('/benchmark')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            let benchmarks = yield this.benchmarkService.readAll();
            res.status(200).send(benchmarks);
        }));
        app.route('/benchmark/:id')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            res.status(200).send(yield this.benchmarkService.readOne(id));
        }));
        app.route('/benchmark/:id')
            .delete((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            yield this.benchmarkService.delete(id);
            res.status(200).send('Deleted');
        }));
    }
}
exports.BenchmarkEndpoint = BenchmarkEndpoint;
//# sourceMappingURL=BenchmarkEndpoint.js.map