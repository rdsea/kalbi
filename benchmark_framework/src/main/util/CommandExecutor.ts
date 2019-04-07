import {Logger} from "log4js";
import {exec} from "child_process";


export class CommandExecutor {

    constructor(private logger: Logger) {

    }


    async executeCommand(cmdText: string): Promise<string> {

        let self = this;

        return new Promise<string>(
            (resolve, reject) => {

                exec(cmdText, {
                    maxBuffer: 1024 * 500,
                    env: {
                        ...process.env
                    }
                }, function (err, data, stderr) {

                    if (err) {
                        reject(err);
                    }
                    self.logger.debug(data);

                    resolve(data);

                });
            }
        );
    }


    async executeCommandWithTimeout(cmdText: string, timeoutMs: number): Promise<string> {

        let self = this;

        return new Promise<string>(
            (resolve, reject) => {

                exec(cmdText, {maxBuffer: 1024 * 500, timeout: timeoutMs}, function (err, data, stderr) {
                    if (err) {
                        reject(err + ' ' + stderr);
                    }
                    self.logger.debug(data);

                    resolve(data);

                });
            }
        );
    }

}