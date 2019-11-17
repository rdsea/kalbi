

let request = require("request");

let options = { method: 'POST',
    url: 'http://34.89.224.188:9000/api/v1/experimentsOfDeploymentPattern',
    headers:
        {   Accept: 'application/json',
            'Content-Type': 'application/json' },
    body:
        { name: 'edge_service',
            peers: [ { name: 'vehicle_iot', peers: [], resourceType: 3 } ],
            resourceType: 1 },
    json: true };

request(options, function (error, response, body) {
    if (error) throw new Error(error);

    let totalLatency = 0;
    let txCount = 0;
    for (let qualityAttr of body[0].benchmark.qualityAttributes) {
        if (qualityAttr.hasOwnProperty('txResults')) {
            for (let txResult of qualityAttr.txResults) {
                if (txResult.data) {
                    totalLatency = totalLatency + txResult.data.acceptationTime;
                    txCount++;
                }
            }
        }
    }
    console.log('Average latency of the benchmarked interaction = ' + (totalLatency/txCount) + 'ms')
});
