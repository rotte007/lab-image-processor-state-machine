import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event, context) => {
    const requestId = context.awsRequestId;

    try {
        console.log({
            level: "info",
            requestId,
            message: "Writing to DynamoDB",
            event
        });

        const originalImageObject = event.images.find(image => image.original);
        const original = originalImageObject ? originalImageObject.original.Payload : null;

        const resizedImageObject = event.images.find(image => image.resized);
        const resized = resizedImageObject ? resizedImageObject.resized.Payload : null;

        if (!original || !resized) {
            throw new Error("Original or resized image not found");
        }

        const item = {
            TableName: "thumbnails",
            Item: {
                original: { S: `${original?.region}|${original?.bucket}|${original?.key}` },
                thumbnail: { S: `${resized?.region}|${resized?.bucket}|${resized?.key}` },
                timestamp: { N: `${Date.now()}` }
            }
        };

        await dynamoDB.send(new PutItemCommand(item));

        console.log({
            level: "info",
            requestId,
            message: "Image metadata written to DynamoDB",
            item
        });

        return true;
    } catch (error) {
        console.error({
            level: "error",
            requestId,
            message: "Error writing to DynamoDB",
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
