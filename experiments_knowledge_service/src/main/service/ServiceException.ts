

export class ServiceException extends Error {

    constructor(public message: string) {
        super(message);
    }

}