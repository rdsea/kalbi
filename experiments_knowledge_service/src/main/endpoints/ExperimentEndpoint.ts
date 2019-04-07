import {IExperimentService} from "../service/interfaces";
import {Logger} from "log4js";
import * as express from "express";
import {Request} from "express";
import {Response} from "express";
import {Experiment} from "../model/dtos";
import {ValidationException} from "../validation/ValidationException";


export class ExperimentEndpoint {

    constructor(private experimentService: IExperimentService, private logger: Logger) {

    }

    public routes(app: express.Router): void {

        app.route('/experiment')
            .post(async (req: Request, res: Response) => {

                    try {
                        let newExp: Experiment = req.body;

                        newExp = await this.experimentService.create(newExp);
                        res.status(200).send(newExp);
                    } catch (e) {
                        if (e instanceof ValidationException) {
                            this.logger.info(e);
                            res.status(400).send(e);
                        } else {
                            throw e;
                        }
                    }


                }
            );

        app.route('/experiment')
            .get(
                async (req: Request, res: Response) => {

                    res.status(200).send(await this.experimentService.readAll());

                }
            );

        app.route('/experiment/:id')
            .get(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;
                    res.status(200).send(await this.experimentService.readOne(id));
                }
            );

        app.route('/experiment/:id')
            .delete(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;

                    await this.experimentService.delete(id);

                    res.status(200).send('Deleted');
                }
            );
    }
}