import {IDeploymentPatternService} from "../service/interfaces";
import {Logger} from "log4js";
import * as express from "express";
import {Request} from "express";
import {Response} from "express";
import {DeploymentPattern} from "../model/dtos";
import {ValidationException} from "../validation/ValidationException";


export class DeploymentPatternEndpoint {

    constructor(private deploymentPatternService: IDeploymentPatternService, private logger: Logger) {

    }

    public routes(app: express.Router): void {

        app.route('/dep_pattern')
            .post(async (req: Request, res: Response) => {

                    try {
                        let newDepPatt: DeploymentPattern = req.body;
                        newDepPatt = await this.deploymentPatternService.create(newDepPatt);
                        res.status(200).send(newDepPatt);
                    } catch (e) {
                        if (e instanceof ValidationException) {
                            this.logger.info(e);
                            res.status(400).send(e);
                        } else {
                            this.logger.error(e);
                            throw e;
                        }
                    }


                }
            );

        app.route('/dep_pattern')
            .get(
                async (req: Request, res: Response) => {

                    res.status(200).send(await this.deploymentPatternService.readAll());

                }
            );

        app.route('/dep_pattern/:id')
            .get(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;
                    res.status(200).send(await this.deploymentPatternService.readOne(id));
                }
            );

        app.route('/dep_pattern/:id')
            .delete(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;

                    await this.deploymentPatternService.delete(id);

                    res.status(200).send('Deleted');
                }
            );
    }


}