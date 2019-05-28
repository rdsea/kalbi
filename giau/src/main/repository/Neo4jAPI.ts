import {Logger} from "log4js";
import * as neo4j from "neo4j-driver";
import Session from "neo4j-driver/types/v1/session";
import {IGraphDBAPI} from "./interfaces";


export class Neo4jAPI implements IGraphDBAPI {

    private driver;

    constructor(private logger: Logger) {
        let testing: boolean = process.env.NODE_ENV === "test";
        let dev: boolean = process.env.NODE_ENV === 'dev';
        let prod: boolean = process.env.NODE_ENV === 'prod';
        if (testing || dev) {
            this.driver = neo4j.v1.driver('bolt://localhost', neo4j.v1.auth.basic('neo4j', 'neo'));
        } else if (prod) {
            this.driver = neo4j.v1.driver('bolt://neo4j', neo4j.v1.auth.basic('neo4j', 'neo'));
        } else {
            this.logger.error('Invalid NODE_ENV setting!');
            process.exit(-10);
        }
    }

    public async makeGraphRequest(requestCmd: string): Promise<any> {

        let session: Session = this.driver.session();

        try {
            let result = await this.executeCypherQL(requestCmd, session);
            await session.close();
            return result;
        } catch (e) {
            this.logger.error('Error when executing graph request ' + e);
            await session.close();
            return null;
        }
    }

    public async closeConnection() {
        await this.driver.close();
    }

    private async executeCypherQL(cypherCmd: string, session: Session): Promise<any> {

        return new Promise<any>(
            (resolve, reject) => {
                session.run(cypherCmd)
                    .then((result) => {
                        resolve(result);
                    })
                    .catch((err) => {
                        reject(err);
                    })
            }
        );
    }



}