docker rm $(docker ps -a -q)
docker rmi filiprydzi/experiments_knowledge_service:0.8.3
docker-compose up