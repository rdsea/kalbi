

export class V2XPaaS {

    private car: DrivingData;


    constructor(id: string) {
        this.car = {
            id: id,
            velocity: 0,
            acceleration: null
        };
    }

    public getVehicleDrivingData():DrivingData {

        this.car.velocity++;

        let drivingData: DrivingData = {
            acceleration: this.car.acceleration,
            id: this.car.id,
            velocity: this.car.velocity
        };

        return drivingData;
    }

    public getVehicleId() {
        return this.car.id;
    }


}