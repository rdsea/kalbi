pragma solidity ^0.4.17;

contract ConnectedCars {


    struct Car {
        uint8 velocity;
        uint8 acceleration;
        uint index;
    }

    mapping(uint => Car) private carsMapping;
    uint[] private carIndex;



    function insertVehicle(uint id, uint8 _velocity, uint8 acc) public {

        carsMapping[id].velocity = _velocity;
        carsMapping[id].acceleration = acc;
        carsMapping[id].index = carIndex.push(id)-1;


    }

    function getVehicle(uint id) public constant returns (uint8 velocity, uint8 acceleration, uint index) {


        return (
        carsMapping[id].velocity,
        carsMapping[id].acceleration,
        carsMapping[id].index
        );

    }

    function updateVehicleVelocity(uint id, uint8 velocity) public {
        carsMapping[id].velocity = velocity;

    }

    function updateVehicleAcc(uint id, uint8 acceleration) public {
        carsMapping[id].acceleration = acceleration;
    }



}