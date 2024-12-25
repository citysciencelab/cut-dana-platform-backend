import express, {Request, Response, Router} from "express";
import {filesUpload, signUrl} from "../utils/minio.ts";
import {PrismaClient} from "@prisma/client";

const prismaClient = new PrismaClient();


const filesRouter = Router()

filesRouter.get('/:context/:filename', async (req: Request, res: Response) => {
    const {context, filename} = req.params;

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

    return res.redirect(signedUrl)
});
filesRouter.post('/:context', filesUpload.single('files'), async (req: Request, res: Response) => {

    const minioMetaData = req.file;

    const file = {
        fileContext: req.params.context ?? "",
        filename: minioMetaData.originalname,
        mimetype: minioMetaData.mimetype,
        bucket: minioMetaData.bucket,
        encoding: minioMetaData.encoding,
        key: minioMetaData.filename,
        provider: 'minio',
        providerMetaData: JSON.stringify(minioMetaData),
    }

    console.log(file);

    let newFile;

    try {
        newFile = await prismaClient.file.create({data:file});
    } catch (e) {
        res.status(500).json({
            message: e.message,
            status: 500,
            stack: e.stack
        });
        throw e;
    }

    return res.status(201).send(newFile);

});

export default filesRouter;

