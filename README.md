# Benchmark Service for Blockchain-based Software Systems

## Contributors

* Filip Rydzi
* Hong-Linh Truong


## Modules

### Blockchain Benchmark Framework

This module can be found in the directory `benchmark_framework`.
The module is a NodeJS application. It's responsible for running the benchmarks. The app can be executed locally or in a docker container.
View the README.md in the project for more information about startup and configuration

### Experiments Knowledge Service

This module can be found in the directory `experiments_knowledge_service`.
The module is a NodeJS application, which utilizes MongoDB and Neo4J for the persistence layer. It exposes a set of RESTful APIs, which are documented in SwaggerUI. ExpressJS has been used to build those APIs. This application can be executed in a Docker container as well.
View the README.md in the project for more information about startup and configuration

### Emulators

#### V2X Communication Emulator

This module can be found in the directory `emulators/v2x_communication`.
This module is a NodeJS application, producing a stream of driving data and persisting them to a [Ethereum|Hyperledger-Fabric] blockchain node. You can run the app locally or inside a docker container.
View the README.md in the project for more information about startup and configuration

### Utilities

#### Results Parser 

This module can be found in the directory `utilities/results_parser`.
This module is a simple NodeJS application, used to do some transformations of the experiments data.
View the README.md in the project for more information about startup and configuration.

### Experiments

This module includes various experiments, which were benchmarked by the Blockchain Benchmark Framework. The directories `experiments/configuration`, `experiments/topologies` contain the configuration of the experiments, along with the related topologies. The directory `experiments/results` contains two further subdirectories:
* `benchmarks_results` - a json representation of benchmarks' outcomes.
* `emulated_vehicles_logs` - logs produced by v2x_communication emulator, when running the benchmarks.

## References 

## Acknowledgement
* Google Cloud Platform Research Grant 


------------------------
Copyright 2019-, by Service Engineering Analytics team (rdsea.github.io).
Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).