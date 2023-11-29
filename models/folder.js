import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Schema, model } from "mongoose";
import { s3client } from "../models/image.js";

/* eslint-disable no-process-env */
const fileSchema = new Schema({
        originalname: String,
        key: String,
        location: String
    }),

    folderSchema = new Schema({
        context: {type: String, unique: true},
        files: [fileSchema]
    }),
    Folder = model("Folder", folderSchema);

/**
 * Deletes files from S3
 * @param {Array} files - array of image objects
 * @returns {void}
 */
function deleteFilesFromS3 (files) {
    const objects = files.map((file) => {
        return {Key: file.key};
    });

    return s3client.send(new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
            Objects: objects
        }
    }));
}

/* eslint-enable no-process-env */

export { Folder, deleteFilesFromS3, fileSchema, folderSchema };

