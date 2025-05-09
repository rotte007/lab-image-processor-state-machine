import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        const params = {
            Bucket: event.s3.bucket.name,
            Key: event.s3.object.key
        };

        await s3.send(new DeleteObjectCommand(params));

        console.log({
            level: "info",
            requestId,
            message: "File deleted successfully",
            params
        });

        return true;
    } catch (error) {
        console.error({
            level: "error",
            requestId,
            message: "Error deleting file",
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
