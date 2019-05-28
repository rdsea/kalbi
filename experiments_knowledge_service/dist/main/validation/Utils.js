"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static convertStringToNumber(str) {
        if (typeof str == 'number') {
            return str;
        }
        if (str == null || str == '') {
            return null;
        }
        return +str;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map