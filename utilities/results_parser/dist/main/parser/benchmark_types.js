"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BlockchainImpl;
(function (BlockchainImpl) {
    BlockchainImpl[BlockchainImpl["eth"] = 0] = "eth";
    BlockchainImpl[BlockchainImpl["hypfab"] = 1] = "hypfab";
})(BlockchainImpl = exports.BlockchainImpl || (exports.BlockchainImpl = {}));
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
