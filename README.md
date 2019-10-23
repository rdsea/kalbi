# Benchmark Service for Blockchain-based Software Systems

## Contributors

* Filip Rydzi
* Hong-Linh Truong
## References:
* Filip Rydzi, Hong-Linh Truong, [Sharing Blockchain Performance Knowledge for Edge Service Development](https://www.researchgate.net/publication/333533426_Sharing_Blockchain_Performance_Knowledge_for_Edge_Service_Development), Oct 2019.
* Hong-Linh Truong, Filip Rydzi, [Benchmarking Blockchain Interactions in Mobile Edge Cloud Software Systems](https://www.researchgate.net/publication/333388734_Benchmarking_Blockchain_Interactions_in_Mobile_Edge_Cloud_Software_Systems), Sep 2019.

## Modules

### Blockchain Benchmark Framework

This module can be found in the directory `benchmark_framework`.
The module is a NodeJS application. It's responsible for running the benchmarks. The app can be executed locally or in a docker container.
View the README.md in the project for more information about startup and configuration

### GIAU (knowledGe for blockchaIn Applications and Utilties)

This module can be found in the directory `giau`.
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

#### GIAU Emulated Data Generator

This module can be in found in the directory `utilities/giau_emulated_data_generator`.
This module is a NodeJS application, which generates emulated data for GIAU.
View the README.md in the project for more information about startup and configuration.

### Experiments

This module includes various experiments, which were benchmarked by the Blockchain Benchmark Framework. The directories `experiments/configuration`, `experiments/topologies` contain the configuration of the experiments, along with the related topologies. The directory `experiments/results` contains two further subdirectories:
* `benchmarks_results` - a json representation of benchmarks' outcomes.
* `emulated_vehicles_logs` - logs produced by v2x_communication emulator, when running the benchmarks.

## References

## Acknowledgement
* Google Cloud Platform Research Grant


------------------------
Copyright 2019-, by Service Engineering Analytics team (http://rdsea.github.io/).
Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).
