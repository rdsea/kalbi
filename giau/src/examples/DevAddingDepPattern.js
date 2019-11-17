

var request = require("request");

var options = { method: 'POST',
    url: 'http://34.89.224.188:9000/api/v1/dep_pattern',
    headers:
        {    Accept: 'application/json',
            'Content-Type': 'application/json' },
    body:
        { name: 'interaction between an edge service and vehicle',
            structure:
                { name: 'edge_service',
                    peers: [ { name: 'vehicle', resourceType: 3, peers: [] } ],
                    resourceType: 1 },
        },
    json: true };

request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
});
