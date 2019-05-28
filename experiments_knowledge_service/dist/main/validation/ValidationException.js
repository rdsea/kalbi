"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationException extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.ValidationException = ValidationException;
//# sourceMappingURL=ValidationException.js.map