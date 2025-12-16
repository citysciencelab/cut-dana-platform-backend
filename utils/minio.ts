import {Client} from "minio";
import {MinioStorageEngine} from "@namatery/multer-minio";
import multer from "multer";

export const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT!) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    region: process.env.MINIO_REGION || 'garage',
})

export const filesUpload = multer({
    storage: new MinioStorageEngine(minioClient, process.env.MINIO_BUCKET!,  {
        object: {
            name: (_, file) => {
                return `${Date.now()}-${file.originalname}`;
            },
            useOriginalFilename: false
        }
    })
});

export async function signUrl(httpMethod: string, key: string) {
    if (!minioClient) {
        throw new Error("MinIO client is not initialized");
    }

    const bucketName = process.env.MINIO_BUCKET || "dana-dev"; // Update with your bucket name
    const expirySeconds = 3600; // URL expiry time in seconds (1 hour)

    try {
        const preSignedUrl = await minioClient.presignedGetObject(bucketName, key, expirySeconds);
        return new URL(preSignedUrl); // Optional formatting if necessary
    } catch (error) {
        throw error;
    }
}
