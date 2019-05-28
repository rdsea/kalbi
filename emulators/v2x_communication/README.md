# V2X Communication Emulator
V2X Communication Emulator produces a stream of random driving data, as shown in the listing below. Further, it wraps the data to a transaction and pushes it into a blockchain node. While it observes, how long does it take to accept the transaction by blockchain, and how many of the submitted transactions have been accepted.
```
{
  id: 7785705911,
  timestamp: 2019-30-3 20:27:58.1
  velocity: 50,
  acceleration: 1
},
{
  id: 7785705912,
  timestamp: 2019-30-3 20:27:58.2
  velocity: 51,
  acceleration: 5
},
{
  id: 7785705913,
  timestamp: 2019-30-3 20:27:59.1
  velocity: 56,
  acceleration: -10
},
...
```

**Currently supported Blockchains:**
* [Ethereum](https://www.ethereum.org/)
* [Hyperledger Fabric](https://www.hyperledger.org/projects/fabric)

## Getting Started

These instructions will guide you through the process of installation and configuration of the framework. To run the project locally for testing or development purposes, see Running section.

### Prerequisites
1. Installed [NodeJS](https://nodejs.org/en/)
2. Installed [npm](https://www.npmjs.com/)

OR

1. Installed [Docker](https://www.docker.com/)

### Installing
#### Locally
1. Install the required dependencies with: (This step is not required if you plan to run the framework in a docker container)
```
npm install
```
2. Build the project
```
npm run build
```
#### In Docker container
1. Build a docker image
```
docker build . -t filiprydzi/v2x_communication
```
## Running the tests
```
npm run test
```

## Running
### Locally
The application can be executed in two modes:
* Ethereum: it will push the data to an Ethereum blockchain
The following command, deploys a smart contract, which is used to modify the driving data in a state blockchain's database.
```
npm run start ethereum bc_ip_address deploy-smart-contract
```
The command below, starts generating a driving data stream, and saves it to blockchain.
```
npm run start ethereum bc_ip_address run-producer vehicle_name rounds_nr contract_address
```
+ Arguments
    - bc_ip_address: ip address of an ethereum blockchain node. The emulator will send the data to the node.
    - vehicle_name: name of a vehicle, emulated by this emulator
    - rounds_nr: number of driving data entries in the stream
    - contract_address: address of the deployed smart contract
* Hyperledger-Fabric: works analogously to the Ethereum version. Beside, you have to supply main_orderer_name as a argument, which is a name of main orderer node in the hyperledger fabric blockchain.
```
npm run start hypfab run-producer vehicle_name rounds_nr main_orderer_name
```
### In Docker container
* Ethereum - Works analogously with the npm local execution. While you have to map volumes, for the logs, results, and keys for accessing blockchain are stored.
```
docker run -d -v ~/logs:/v2x_communication/log -v ~/sim-results:/v2x_communication/results -v ~/ethereum/tmp-keystore/keystore:/data/keystore --name vehicle1 filiprydzi/v2x_communication start ethereum bc_ip_address run-producer vehicle1 100 contract_address
```
* Hyperledger-Fabric - Works analogously with the npm local execution
```
docker run -d -v ~/logs:/v2x_communication/log -v ~/sim-results:/v2x_communication/results ~/hfc-key-storevehicle1:/v2x_communication/hfc-key-storevehicle1 --name vehicle1 filiprydzi/v2x_communication start hypfab run-producer vehicle1 100 main_orderer_name
```
## Built With

* [NodeJS](https://nodejs.org/en/) - Runtime Environment
* [NPM](https://www.npmjs.com/) - Dependency Management
* [Typescript](https://www.typescriptlang.org/)
* [Docker](https://www.docker.com/) - Execution Environment

## License
Copyright 2019-, by Service Engineering Analytics team (http://rdsea.github.io/).
Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).
