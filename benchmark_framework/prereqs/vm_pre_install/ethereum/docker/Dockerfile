FROM ethereum/client-go:v1.8.20
COPY eth_common /eth_common

RUN geth --rpc --rpcaddr 0.0.0.0 --rpcport 8545 --datadir /data --syncmode "full" --rpcapi="db,eth,net,web3,personal,web3" --txpool.pricelimit "0" --miner.gasprice "0" --maxpeers "80" --nodiscover init eth_common/genesis.json

ENTRYPOINT ["geth"]
