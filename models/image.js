// TODO: remove this model completely
import {model, Schema, ObjectId} from "mongoose";
import {S3Client, DeleteObjectsCommand} from "@aws-sdk/client-s3";

/* eslint-disable no-process-env */

const imageSchema = new Schema({
        key: String,
        hash: {
            type: String,
            index: true
        },
        location: String,
        storyId: {
            type: ObjectId,
            index: true
        },
        stepMajor: {
            type: Number,
            index: true
        },
        stepMinor: {
            type: Number,
            index: true
        }}),

    Image = model("Image", imageSchema),
    s3client = new S3Client({
        secretAccessKey: process.env.AWS_ACCESS_KEY_ID,
        accessKeyId: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

/**
 * Deletes images from S3
 * @param {Array} images - array of image objects
 * @returns {void}
 */
function deleteImagesFromS3 (images) {
    const objects = images.map((image) => {
        return {Key: image.key};
    });

    return s3client.send(new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
            Objects: objects
        }
    }));
}

/* eslint-enable no-process-env */

export {Image, imageSchema, s3client, deleteImagesFromS3};