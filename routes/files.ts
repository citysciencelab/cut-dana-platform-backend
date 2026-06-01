import  {type NextFunction, type Request, type Response, Router} from "express";
import {filesUpload, minioClient} from "../utils/minio.ts";
import {PrismaClient} from "@prisma/client";
import asyncHandler from "../handlers/asyncHandler.ts";
import {setupLogger} from "../utils/logger.ts";
import {Readable} from "node:stream";

const localOnly = process.env.LOCAL_ONLY_DB === 'true';
const prismaClient = new PrismaClient();
const filesRouter = Router()

filesRouter.get('/*', asyncHandler(async (req: Request, res: Response) => {
    const pathArray = req.params[0].split('/');
    const filename = pathArray.pop();
    const context = pathArray.join('/');

    const data = await prismaClient.file.findFirst({
        where: {
            fileContext: context,
            filename: filename
        }
    })

    if (!data) {
        return res.status(404).json({})
    }

    const stream = await minioClient!.getObject(process.env.MINIO_BUCKET!, data.key);
    res.setHeader('Content-Type', data.mimetype ?? 'application/octet-stream');
    stream.pipe(res);
}));

filesRouter.post('/:context', (req: Request, res: Response, next: NextFunction) => {
    // Debug: log what arrives before multer
    const logger = setupLogger({ label: 'files:upload' });
    logger.info(`[files POST] content-type: ${req.headers['content-type']}`);
    logger.info(`[files POST] content-length: ${req.headers['content-length']}`);
    next();
}, filesUpload.single('files'), (err: Error, req: Request, res: Response, _next: NextFunction) => {
    // Multer error handler
    const logger = setupLogger({ label: 'files:multer-error' });
    logger.error('[files] Multer error:', err);
    res.status(500).json({ success: false, message: `Multer error: ${err?.message}` });
}, asyncHandler(async (req: Request, res: Response) => {
    const logger = setupLogger({ label: 'files:upload' });
    logger.info(`[files POST] req.file: ${JSON.stringify(req.file?.originalname ?? 'undefined')}`);
    logger.info(`[files POST] req.body keys: ${JSON.stringify(Object.keys(req.body ?? {}))}`);

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file received. Ensure the field name is 'files' and the request is multipart/form-data.",
        });
    }

    const objectKey = `${Date.now()}-${req.file.originalname}`;

    if (!localOnly) {
        // Upload buffer to MinIO
        const stream = Readable.from(req.file.buffer);
        await minioClient!.putObject(
            process.env.MINIO_BUCKET!,
            objectKey,
            stream,
            req.file.size,
            { 'Content-Type': req.file.mimetype }
        );
    }

    const file = {
        fileContext: req.params.context ?? "",
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        bucket: process.env.MINIO_BUCKET ?? 'local',
        encoding: req.file.encoding,
        key: objectKey,
        provider: localOnly ? 'local' : 'minio',
        providerMetaData: JSON.stringify({ originalname: req.file.originalname, size: req.file.size }),
    }

    const newFile = await prismaClient.file.create({ data: file });

    return res.status(201).json(newFile);
}));

export default filesRouter;

