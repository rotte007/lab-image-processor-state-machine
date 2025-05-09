import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        console.log({
            level: "info",
            requestId,
            message: "Processing image resizing",
            event
        });

        const { bucket, object } = event.s3;
        const key = decodeURIComponent(object.key.replace(/\+/g, " "));
        const destinationBucket = process.env.DESTINATION_BUCKET;

        const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket.name, Key: key }));

        const resizedImage = await sharp(await Body.transformToByteArray()).resize(150).toBuffer();
        const newKey = key.replace(".jpeg", "-small.jpeg");

        await s3.send(new PutObjectCommand({
            Bucket: destinationBucket,
            Key: newKey,
            Body: resizedImage,
            ContentType: "image/jpeg"
        }));

        console.log({
            level: "info",
            requestId,
            message: "Resized image uploaded",
            destinationBucket,
            newKey
        });

        return { region: process.env.AWS_REGION, bucket: destinationBucket, key: newKey };
    } catch (error) {
        console.error({
            level: "error",
            requestId,
            message: "Error resizing image",
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
