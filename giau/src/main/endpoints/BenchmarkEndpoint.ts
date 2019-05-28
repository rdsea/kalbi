import {IBenchmarkService} from "../service/interfaces";
import {Logger} from "log4js";
import * as express from "express";
import {Request} from "express";
import {Response} from "express";
import {Benchmark} from "../model/dtos";
import {ValidationException} from "../validation/ValidationException";


export class BenchmarkEndpoint {

    constructor(private benchmarkService: IBenchmarkService, private logger: Logger) {

    }

    public routes(app: express.Router): void {


        app.route('/benchmark')
            .post( async (req: Request, res: Response) => {
                    let newExpResult: Benchmark = req.body;
                    try {
                        newExpResult = await this.benchmarkService.create(newExpResult);
                        res.status(200).send (newExpResult);
                    } catch (e) {
                        if (e instanceof ValidationException) {
                            this.logger.info(e);
                            res.status(400).send (e);
                        } else {
                            throw e;
                        }
                    }

                }
            );

        app.route('/benchmark')
            .get(
                async (req: Request, res: Response) => {

                    let benchmarks: Benchmark[] = await this.benchmarkService.readAll();
                    res.status(200).send( benchmarks );

                }
            );

        app.route('/benchmark/:id')
            .get(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;
                    res.status(200).send( await this.benchmarkService.readOne(id) );
                }
            );

        app.route('/benchmark/:id')
            .delete(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;

                    await this.benchmarkService.delete(id);

                    res.status(200).send('Deleted');
                }
            );
    }


}