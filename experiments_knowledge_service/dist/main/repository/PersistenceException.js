"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PersistenceException extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.PersistenceException = PersistenceException;
