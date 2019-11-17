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
const mongodb_1 = require("mongodb");
const AbsCRUDMongoDBRepository_1 = require("./AbsCRUDMongoDBRepository");
const PersistenceException_1 = require("./PersistenceException");
class NodeStructureRepository extends AbsCRUDMongoDBRepository_1.AbsCRUDMongoDBRepository {
    constructor(mongoDb, logger) {
        super(mongoDb, 'node_structure', logger);
    }
    readOneByIdWithArtefacts(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield this.db.collection(this.collectionName).aggregate([{
                        $match: {
                            _id: new mongodb_1.ObjectId(id)
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
                let results = yield result.toArray();
                if (results && results[0]) {
                    // if the NodeDataModel has no joined application
                    if (!results[0].application) {
                        results[0].application = null;
                    }
                    return results[0];
                }
                else {
                    return null;
                }
            }
            catch (e) {
                this.logger.warn('Persistence Layer exception: ' + e);
                throw new PersistenceException_1.PersistenceException(e);
            }
        });
    }
}
exports.NodeStructureRepository = NodeStructureRepository;
//# sourceMappingURL=NodeStructureRepository.js.map