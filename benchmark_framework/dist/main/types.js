"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BlockchainImpl;
(function (BlockchainImpl) {
    BlockchainImpl[BlockchainImpl["eth"] = 0] = "eth";
    BlockchainImpl[BlockchainImpl["hypfab"] = 1] = "hypfab";
})(BlockchainImpl = exports.BlockchainImpl || (exports.BlockchainImpl = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType[ResourceType["CLOUD_SERVICE"] = 0] = "CLOUD_SERVICE";
    ResourceType[ResourceType["EDGE_SERVICE"] = 1] = "EDGE_SERVICE";
    ResourceType[ResourceType["RSU_RESOURCE"] = 2] = "RSU_RESOURCE";
    ResourceType[ResourceType["VEHICLE_IOT"] = 3] = "VEHICLE_IOT";
    ResourceType[ResourceType["IOT_RESOURCE"] = 4] = "IOT_RESOURCE";
})(ResourceType = exports.ResourceType || (exports.ResourceType = {}));
/**
 * enums all possible bc features
 */
var BlockchainRole;
(function (BlockchainRole) {
    BlockchainRole[BlockchainRole["none"] = 0] = "none";
    BlockchainRole[BlockchainRole["creator"] = 1] = "creator";
    BlockchainRole[BlockchainRole["miner"] = 2] = "miner";
    BlockchainRole[BlockchainRole["all"] = 3] = "all";
})(BlockchainRole = exports.BlockchainRole || (exports.BlockchainRole = {}));
//# sourceMappingURL=types.js.map