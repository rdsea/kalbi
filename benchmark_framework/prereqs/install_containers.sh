echo ''
echo 'Pulling docker images'
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker rmi filiprydzi/v2x_communication
docker rmi filiprydzi/geth

echo 'Pulling v2x_communication images'
docker pull filiprydzi/v2x_communication
echo 'Pulling custom geth image'
docker pull filiprydzi/geth
echo 'Pulling docker images finished'
