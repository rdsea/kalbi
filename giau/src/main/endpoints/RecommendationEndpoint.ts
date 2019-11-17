import {IRecommendationService} from "../service/interfaces";
import {Logger} from "log4js";
import * as express from "express";
import {Request} from "express";
import {Response} from "express";
import {Experiment, DPNode} from "../model/dtos";
import {ValidationException} from "../validation/ValidationException";


export class RecommendationEndpoint {

    constructor(private recommendationService: IRecommendationService, private logger: Logger) {

    }

    public routes(app: express.Router): void {

        app.route('/bestBenchmarkForDeploymentPattern/:id')
            .get(async (req: Request, res: Response) => {

                    let depPatternId: string = req.params.id;
                    let syncPriority: number = req.query.syncPrior ? req.query.syncPrior : -1;
                    let txAcceptRate: number = req.query.txAcceptRate ? req.query.txAcceptRate : -1;
                    let txAcceptTime: number = req.query.txAcceptTime ? req.query.txAcceptTime : -1;
                    let infrastructureResourceUtil: number = req.query.infRes ? req.query.infRes : -1;

                    let exp: Experiment = await this.recommendationService.bestBenchmarkForDeploymentPattern(depPatternId, syncPriority, txAcceptRate, txAcceptTime, infrastructureResourceUtil);
                    res.status(200).send(exp);
                }
            );


        app.route('/recommendTopology')
            .post(async (req: Request, res: Response) => {

                    let syncPriority: number = req.query.syncPrior ? req.query.syncPrior : -1;
                    let txAcceptRate: number = req.query.txAcceptRate ? req.query.txAcceptRate : -1;
                    let txAcceptTime: number = req.query.txAcceptTime ? req.query.txAcceptTime : -1;
                    let infrastructureResourceUtil: number = req.query.infRes ? req.query.infRes : -1;
                    let returnBenchmarks: boolean = req.query.returnBenchmarks ? req.query.returnBenchmarks: false;

                    let pureNode: DPNode = req.body;

                    try {
                        let result: any = await this.recommendationService.recommendTopology(pureNode, syncPriority, txAcceptRate, txAcceptTime, infrastructureResourceUtil, returnBenchmarks);
                        res.status(200).send(result);
                    } catch (e) {
                        if (e instanceof ValidationException) {
                            this.logger.info(e);
                            res.status(400).send (e);
                        } else {
                            this.logger.error(e);
                            throw e;
                        }
                    }
                }
            );

        app.route('/recommendTopologyTOSCA')
            .post(async (req: Request, res: Response) => {

                    let syncPriority: number = req.query.syncPrior ? req.query.syncPrior : -1;
                    let txAcceptRate: number = req.query.txAcceptRate ? req.query.txAcceptRate : -1;
                    let txAcceptTime: number = req.query.txAcceptTime ? req.query.txAcceptTime : -1;
                    let infrastructureResourceUtil: number = req.query.infRes ? req.query.infRes : -1;

                    let toscaTopologyDefinition: string = req.body;

                    let recommendedTopologyInTOSCA: string = await this.recommendationService.
                        recommendTopologyTOSCA(toscaTopologyDefinition, syncPriority, txAcceptRate, txAcceptTime, infrastructureResourceUtil);

                    res.status(200).send(recommendedTopologyInTOSCA);
                }
            );

    }

}