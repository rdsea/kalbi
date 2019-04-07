# Blockchain Benchmark Framework

Blockchain Benchmark is a framework, which allows user to test different topologies with a deployed blockchain solution. User can configure experiments, each representing a particular blockchain deployment in the topology, and get a set of quality metrics.

**Currently supported Quality Metrics:**
* Transactions acceptance rate
* Transaction acceptance time
* Synchronisation State
* Resource consumption (CPU, memory)


**Currently supported Blockchains:**
* [Ethereum](https://www.ethereum.org/)
* [Hyperledger Fabric](https://www.hyperledger.org/projects/fabric)

**Currently supported External Resource Providers**
* [Google Cloud Platform](https://cloud.google.com/)

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
docker build . -t bc_benchmark_framework
```
### Configuration
A configuration file is stored under /config/config.yaml. You have to supply the following fields:
* resultsDir: a directory, where the results of benchmarks will be stored
* sshKeyPath: a path to your ssh key, used to access resources (vms, physical machines...). The ssh directory, containing ssh config, known hosts, etc. is assumed to be in ~/.ssh
* sshUsername: username, used when sshed to a machine
* infrastructureProvider: [optional] wraps properties required to interact with an external provider of resources (currently only Google Cloud Platform is supported)

## Running the tests
```
npm run test
```

## Running
### Locally
```
npm run start topologyFilename.json experimentsConfig.yaml
```
Where experimentsConfig.yaml a configuration of the experiments you want to benchmark, such that the experiments are related to the topology stored in topologyFilename.json.
You can find examples of valid experiment configurations in ../experiments/configurations.
Examples of topologies are given in: ../experiments/topologies

### In Docker container
```
docker run -d -v ~/benchmark_framework/config:/benchmark_framework/config -v ~/sshDocker:/root/.ssh -v ~/results:/root/results -v ~/input:/input  --name bc_benchmark_framework bc_benchmark_framework start /input/interaction2small-initialized.json /input/experiments_config-simple.yaml
```
Works analogously with the npm local execution, additionally you have to map required volumes, mainly those mentioned in config.yaml.
## Built With

* [NodeJS](https://nodejs.org/en/) - Runtime Environment
* [NPM](https://www.npmjs.com/) - Dependency Management
* [Typescript](https://www.typescriptlang.org/)
* [Docker](https://www.docker.com/) - Execution Environment

## License
Copyright 2019-, by Service Engineering Analytics team (rdsea.github.io).
Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).
