

export class ValidationException extends Error {

    constructor(public message: string) {
        super(message);
    }


}