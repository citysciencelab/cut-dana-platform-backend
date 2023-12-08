import {HttpRequest} from "@aws-sdk/protocol-http";
import {S3RequestPresigner} from "@aws-sdk/s3-request-presigner";
import {parseUrl} from "@aws-sdk/url-parser";
import {Hash} from "@aws-sdk/hash-node";

/* eslint-disable no-process-env */
/**
 * Returns a signed url for the datasource
 * @param {String} key - key of the datasource
 * @returns {String} signed url
 **/
export function getSignedUrl (key) {
    const s3ObjectUrl = parseUrl(`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`),
        presigner = new S3RequestPresigner({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            },
            region: process.env.AWS_REGION,
            sha256: Hash.bind(null, "sha256")
        });

    // Create a GET request from S3 url.
    return presigner.presign(new HttpRequest(s3ObjectUrl));
}
/* eslint-enable no-process-env */
