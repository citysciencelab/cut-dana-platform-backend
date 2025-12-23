import { setupLogger } from '../utils/logger.ts';
import type { Request, Response, NextFunction } from 'express';

const logger = setupLogger({ label: 'errorHandler' });

export default function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {

    const statusCode = 500;
    const message =
        process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message;

    if (process.env.NODE_ENV !== 'production') {
        logger.error(err);
    }

    const responseObject: any = {
        success: false,
        name: err.name || 'InternalServerError',
        statusCode,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    };

    res.status(statusCode).json(responseObject);

    next();
}
