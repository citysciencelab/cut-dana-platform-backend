import {Client} from "minio";
import multer from "multer";

const localOnly = process.env.LOCAL_ONLY_DB === 'true';

export const minioClient: Client | null = localOnly ? null : new Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT!) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    region: process.env.MINIO_REGION || 'garage',
});

// Always use memory storage — upload to MinIO manually in the route handler
// so errors are visible and req.file is always populated when a file is present.
export const filesUpload = multer({ storage: multer.memoryStorage() });

export async function signUrl(httpMethod: string, key: string) {
    if (!minioClient) {
        throw new Error("MinIO client is not available in LOCAL_ONLY_DB mode");
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
