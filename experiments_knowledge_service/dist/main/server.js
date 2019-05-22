"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const App_1 = require("./App");
var swaggerUi = require('swagger-ui-express'), swaggerDocument = require('../../swagger.json');
exports.PORT = 9000;
let main = new App_1.App();
main.express.use('/api/v1', main.router);
main.express.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
main.express.listen(exports.PORT, () => {
    console.log('listening on port ' + exports.PORT);
    main.run();
});
