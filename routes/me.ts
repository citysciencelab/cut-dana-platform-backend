import {Router, type Request, type Response} from "express";
import authMiddleware from "../middlewares/authMiddleware.ts";
import asyncHandler from "../handlers/asyncHandler.ts";

const meRouter = Router()

meRouter.get('/', authMiddleware, asyncHandler(async (request: Request, response: Response) => {
    return response.json({
        ...request.user
    });
}))

export default meRouter;

