docker build . -t bc_benchmark_framework

rm -rf ~/sshDocker
cd ~
mkdir sshDocker
cp .ssh/g_compute_engine sshDocker/
cp .ssh/g_compute_engine.pub sshDocker/
touch sshDocker/known_hosts
docker run -d -v ~/masterthesis/prototype/benchmark_framework/config:/benchmark_framework/config -v ~/sshDocker:/root/.ssh -v ~/results:/root/results -v ~/input:/input  --name bc_benchmark_framework bc_benchmark_framework start /input/interaction2small-initialized.json /input/experiments_config-simple.yaml