import {ISoftwareArtefactsService} from "../service/interfaces";
import {Logger} from "log4js";
import * as express from "express";
import {Request} from "express";
import {Response} from "express";
import {
    BlockchainArtefact, BlockchainMetadata,
    EdgeProcessingApplication,
} from "../model/dtos";
import {ValidationException} from "../validation/ValidationException";


export class SoftwareArtefactEndpoint {


    constructor(private softArtefactsService: ISoftwareArtefactsService, private logger: Logger) {

    }

    public routes(router: express.Router): void {


        router.route('/software_artefact')
            .post(async (req: Request, res: Response) => {
                    try {
                        if (req.body.implementation) {

                            let bcMetadata: BlockchainMetadata = {
                                implementation: req.body.implementation,
                                featureName: req.body.featureName
                            };

                            let newBcArtefact: BlockchainArtefact = {
                                name: req.body.name,
                                repositoryTag: req.body.repositoryTag,
                                executionEnvironment: req.body.executionEnvironment,
                                bcMetadata: bcMetadata,
                                _id: null
                            };

                            newBcArtefact = <BlockchainArtefact> await this.softArtefactsService.create(newBcArtefact);
                            res.status(200).send(newBcArtefact);

                        } else {
                            let newSoftwareArtefact: EdgeProcessingApplication = {
                                name: req.body.name,
                                repositoryTag: req.body.repositoryTag,
                                executionEnvironment: req.body.executionEnvironment,
                                _id: null
                            };

                            newSoftwareArtefact = <EdgeProcessingApplication> await this.softArtefactsService.create(newSoftwareArtefact);
                            res.status(200).send(newSoftwareArtefact);
                        }
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

        router.route('/software_artefact')
            .get(
                async (req: Request, res: Response) => {
                    res.status(200).send(await this.softArtefactsService.readAll());
                }
            );

        router.route('/software_artefact/:id')
            .get(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;
                    res.status(200).send(await this.softArtefactsService.readOne(id));
                }
            );

        router.route('/software_artefact/:id')
            .delete(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;

                    await this.softArtefactsService.delete(id);

                    res.status(200).send('Deleted');
                }
            );

    }

}