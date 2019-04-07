"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class V2XPaaS {
    constructor(id) {
        this.car = {
            id: id,
            velocity: 0,
            acceleration: null
        };
    }
    getVehicleDrivingData() {
        this.car.velocity++;
        let drivingData = {
            acceleration: this.car.acceleration,
            id: this.car.id,
            velocity: this.car.velocity
        };
        return drivingData;
    }
    getVehicleId() {
        return this.car.id;
    }
}
exports.V2XPaaS = V2XPaaS;
