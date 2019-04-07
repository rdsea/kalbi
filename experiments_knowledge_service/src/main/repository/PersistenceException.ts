

export class PersistenceException extends Error {

    constructor(public message: string) {
        super(message);
    }

}