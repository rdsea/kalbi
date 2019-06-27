import {Db, ObjectId, ObjectID} from "mongodb";
import {NodeJoinedDataModel} from "../model/data_models";
import {AbsCRUDMongoDBRepository} from "./AbsCRUDMongoDBRepository";
import {NodeDataModel} from "../model/data_models";
import {INodeStructureRepository} from "./interfaces";
import {Logger} from "log4js";
import {PersistenceException} from "./PersistenceException";
import {MongoDb} from "./MongoDb";


export class NodeStructureRepository extends AbsCRUDMongoDBRepository<NodeDataModel> implements INodeStructureRepository {


    constructor(mongoDb: MongoDb, logger: Logger) {
        super(mongoDb, 'node_structure', logger);
    }

    async readOneByIdWithArtefacts(id: string): Promise<NodeJoinedDataModel> {

        try {

            let result = await this.db.collection<NodeJoinedDataModel>(this.collectionName).aggregate([{
                $match: {
                    _id: new ObjectId(id)
                }
            }, {
                $lookup: {
                    from: 'software_artefact',
                    localField: 'blockchainArterfacts',
                    foreignField: '_id',
                    as: 'blockchainArterfacts'
                }
            }, {
                $lookup: {
                    from: 'container_configuration',
                    localField: 'container_id',
                    foreignField: '_id',
                    as: 'container'
                }
            }, {
                $lookup: {
                    from: 'software_artefact',
                    localField: 'application',
                    foreignField: '_id',
                    as: 'application'
                }
            }, {
                $project: {
                    _id: 1,
                    application: {
                        $arrayElemAt: [
                            '$application',
                            0
                        ]
                    },
                    blockchainArterfacts: 1,
                    connections: 1,
                    name: 1,
                    resourceType: 1,
                    container: {
                        $arrayElemAt: [
                            '$container',
                            0
                        ]
                    }
                }
            }]);

            let results: NodeJoinedDataModel[] = await result.toArray();

            if (results && results[0]) {
                // if the NodeDataModel has no joined application
                if (!results[0].application) {
                    results[0].application = null;
                }
                return results[0];
            } else {
                return null;
            }

        } catch (e) {
            this.logger.warn('Persistence Layer exception: ' + e);
            throw new PersistenceException(e);
        }
    }


}