import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        const sourceBucket = event.s3.bucket.name;
        const key = event.s3.object.key;
        const destinationBucket = process.env.DESTINATION_BUCKET;

        console.log({
            level: "info",
            requestId,
            message: "Copying file to destination bucket",
            sourceBucket,
            destinationBucket,
            key
        });

        const params = {
            Bucket: destinationBucket,
            CopySource: encodeURI(`/${sourceBucket}/${key}`),
            Key: key
        };

        await s3.send(new CopyObjectCommand(params));

        console.log({
            level: "info",
            requestId,
            message: "File copied successfully",
            destinationBucket,
            key
        });

        return { region: process.env.AWS_REGION, bucket: destinationBucket, key };
    } catch (error) {
        console.error({
            level: "error",
            requestId,
            message: "Error copying file",
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
