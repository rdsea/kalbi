import * as express from "express";
import {Request, Response} from "express";
import {IContainerConfigurationService} from "../service/interfaces";
import {Logger} from "log4js";
import {ContainerConfiguration} from "../model/dtos";
import {ValidationException} from "../validation/ValidationException";


export class ContainerConfigurationEndpoint {

    constructor(private vmService: IContainerConfigurationService, private logger: Logger) {

    }

    public routes(router: express.Router): void {

        router.route('/container_config')
            .post(async (req: Request, res: Response) => {

                    try {
                        let newVMConfig: ContainerConfiguration = {
                            name: req.body.name,
                            provider: req.body.provider,
                            os: req.body.os,
                            vCPUcount: req.body.vCPUcount,
                            storageSSD: req.body.storageSSD,
                            storageHDD: req.body.storageHDD,
                            memory: req.body.memory,
                            _id: null
                        };
                        newVMConfig = await this.vmService.create(newVMConfig);
                        res.status(200).send(newVMConfig);
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

        router.route('/container_config')
            .get(
                async (req: Request, res: Response) => {
                    res.status(200).send(await this.vmService.readAll());
                }
            );

        router.route('/container_config/:id')
            .get(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;

                    res.status(200).send(await this.vmService.readOne(id));
                }
            );

        router.route('/container_config/:id')
            .delete(
                async (req: Request, res: Response) => {
                    let id: string = req.params.id;

                    await this.vmService.delete(id);

                    res.status(200).send('Deleted');
                }
            );
    }

}