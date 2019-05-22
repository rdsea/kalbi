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
const PrecisionRecallEvaluator_1 = require("./PrecisionRecallEvaluator");
class Main {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.createLogger();
            let precisionRecall = new PrecisionRecallEvaluator_1.PrecisionRecallEvaluator(this.logger);
            yield precisionRecall.runTesting();
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
exports.Main = Main;
let main = new Main();
main.run();
//# sourceMappingURL=Main.js.map