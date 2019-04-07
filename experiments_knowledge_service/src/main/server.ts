import {App} from "./App";
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('../../swagger.json');

export const PORT = 9000;


let main: App = new App();

main.express.use('/api/v1', main.router);
main.express.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));



main.express.listen(PORT, () => {
    console.log('listening on port ' + PORT);
    main.run();
});