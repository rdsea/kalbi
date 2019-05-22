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
const child_process_1 = require("child_process");
class CommandExecutor {
    constructor(logger) {
        this.logger = logger;
    }
    executeCommand(cmdText) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            return new Promise((resolve, reject) => {
                child_process_1.exec(cmdText, {
                    maxBuffer: 1024 * 500,
                    env: Object.assign({}, process.env)
                }, function (err, data, stderr) {
                    if (err) {
                        reject(err);
                    }
                    self.logger.debug(data);
                    resolve(data);
                });
            });
        });
    }
    executeCommandWithTimeout(cmdText, timeoutMs) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            return new Promise((resolve, reject) => {
                child_process_1.exec(cmdText, { maxBuffer: 1024 * 500, timeout: timeoutMs }, function (err, data, stderr) {
                    if (err) {
                        reject(err + ' ' + stderr);
                    }
                    self.logger.debug(data);
                    resolve(data);
                });
            });
        });
    }
}
exports.CommandExecutor = CommandExecutor;
//# sourceMappingURL=CommandExecutor.js.map