export const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        const filename = event.s3.object.key;
        const index = filename.lastIndexOf('.');

        const fileType = index > 0 ? filename.substring(index + 1) : null;

        console.log({
            level: "info",
            requestId,
            message: "Extracted file type",
            filename,
            fileType
        });

        return fileType;
    } catch (error) {
        console.error({
            level: "error",
            requestId,
            message: "Error extracting file type",
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
