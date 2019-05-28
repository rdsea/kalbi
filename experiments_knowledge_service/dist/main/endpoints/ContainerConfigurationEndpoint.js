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
class ContainerConfigurationEndpoint {
    constructor(vmService, logger) {
        this.vmService = vmService;
        this.logger = logger;
    }
    routes(router) {
        router.route('/container_config')
            .post((req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                let newVMConfig = {
                    name: req.body.name,
                    provider: req.body.provider,
                    os: req.body.os,
                    vCPUcount: req.body.vCPUcount,
                    storageSSD: req.body.storageSSD,
                    storageHDD: req.body.storageHDD,
                    memory: req.body.memory,
                    _id: null
                };
                newVMConfig = yield this.vmService.create(newVMConfig);
                res.status(200).send(newVMConfig);
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
        router.route('/container_config')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            res.status(200).send(yield this.vmService.readAll());
        }));
        router.route('/container_config/:id')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            res.status(200).send(yield this.vmService.readOne(id));
        }));
        router.route('/container_config/:id')
            .delete((req, res) => __awaiter(this, void 0, void 0, function* () {
            let id = req.params.id;
            yield this.vmService.delete(id);
            res.status(200).send('Deleted');
        }));
    }
}
exports.ContainerConfigurationEndpoint = ContainerConfigurationEndpoint;
//# sourceMappingURL=ContainerConfigurationEndpoint.js.map