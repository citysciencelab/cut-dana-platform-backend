import { type Request, type Response, type NextFunction } from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json(err);
};

export default errorHandler;
