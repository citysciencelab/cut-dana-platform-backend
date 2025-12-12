import  {type Request, type Response, Router} from "express";
import {filesUpload, signUrl} from "../utils/minio.ts";
import {PrismaClient} from "@prisma/client";
import asyncHandler from "../handlers/asyncHandler.ts";

const prismaClient = new PrismaClient();
const filesRouter = Router()

filesRouter.get('/*', asyncHandler(async (req: Request, res: Response) => {
    const pathArray = req.params[0].split('/'); // Split the remaining path into an array
    const filename = pathArray.pop(); // Get the last item as the filename
    const context = pathArray.join('/'); // Join the remaining items as the context

    const data = await prismaClient.file.findFirst({
        where: {
            fileContext: context,
            filename: filename
        }
    })

    if (!data) {
        return res.status(404).json({})
    }

    const signedUrl = await signUrl("get", data.key);

    return res.redirect(signedUrl.toString())
}));

filesRouter.post('/:context', filesUpload.single('files'), asyncHandler(async (req: Request, res: Response) => {
    const minioMetaData = req.file;

    if (!minioMetaData) {
        return res.status(500).json({
            message: "file not found",
            status: 500,
        });
    }

    const file = {
        fileContext: req.params.context ?? "",
        filename: minioMetaData.originalname,
        mimetype: minioMetaData.mimetype,
        bucket: process.env.MINIO_BUCKET!,
        encoding: minioMetaData.encoding,
        key: minioMetaData.filename,
        provider: 'minio',
        providerMetaData: JSON.stringify(minioMetaData),
    }

    const newFile = await prismaClient.file.create({data:file});

    return res.status(201).send(newFile);
}));

export default filesRouter;

