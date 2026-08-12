export default class ErrorHandler extends Error{
    statusCode: Number;
    retryAfterSeconds?: number;

    constructor(statusCode: number, message: string, retryAfterSeconds?: number){
        super(message);
        this.statusCode = statusCode;
        this.retryAfterSeconds = retryAfterSeconds;
        Error.captureStackTrace(this, this.constructor);
    }
}
