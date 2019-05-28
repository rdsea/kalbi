#!/usr/bin/env bash
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker rmi blockchainbenmarkservice/giau:0.8.4
docker-compose up