docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker rmi filiprydzi/experiments_knowledge_service:0.8.4
docker-compose up