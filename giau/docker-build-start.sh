#!/usr/bin/env bash
docker stop mongodb
docker stop giau_neo4j_1
docker stop giau
docker rm mongodb
docker rm giau_neo4j_1
docker rm giau
docker rmi blockchainbenmarkservice/giau:0.8.4
docker-compose up