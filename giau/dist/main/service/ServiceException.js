"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServiceException extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.ServiceException = ServiceException;
//# sourceMappingURL=ServiceException.js.map