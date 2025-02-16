import express, {Router, type Request, type Response} from "express";
import {PrismaClient} from "@prisma/client";

const prismaClient = new PrismaClient();


const stepRouter = Router()

export default stepRouter;

