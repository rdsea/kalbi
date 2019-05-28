# GIAU (knowledGe for blockchaIn Applications and Utilties)

GIAU is a service, managing data related to the experiments, benchmarks, topologies and utilized infrastructure. Beside the data management, it can be used by the developers to obtain recommendations, related to the most suitable deployment of their Blockchain-based application accross the MEC environment. The recommendations are based on the data (experiments), stored in the service. You can interact with the data via a set of the exposed APIs or by connecting directly to the MongoDB database instance, which contains the data.

## Getting Started
These instructions will guide you through the process of installation and configuration of the service.
### Prerequisites
1. Installed [NodeJS](https://nodejs.org/en/)
2. Installed [npm](https://www.npmjs.com/)
3. Installed [MongoDB](https://www.mongodb.com/)
4. Installed [Neo4J](https://neo4j.com/)

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
## Running the tests
```
npm run test
```

## Running
### Locally
```
npm run start-dev
```
A swagger-api documentation is available at http://localhost:9000/api-docs/. It documents all used data models, and exposed APIs.
### In Docker container
```
docker-compose up
```
A swagger-api documentation is available at http://localhost:9000/api-docs/. It documents all used data models, and exposed APIs.
## Built With

* [NodeJS](https://nodejs.org/en/) - Runtime Environment
* [NPM](https://www.npmjs.com/) - Dependency Management
* [Typescript](https://www.typescriptlang.org/)
* [Docker](https://www.docker.com/) - Execution Environment
* [ExpressJS](https://expressjs.com/) - Web framework
* [Swagger](https://swagger.io/) - API documentation
* [MongoDB](https://www.mongodb.com/)
* [Neo4J](https://neo4j.com/)

## License
Copyright 2019-, by Service Engineering Analytics team (http://rdsea.github.io/).
Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).
