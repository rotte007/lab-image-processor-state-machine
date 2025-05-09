import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const stepFunctions = new SFNClient({ region: process.env.AWS_REGION });

export const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        console.log({
            level: "info",
            requestId,
            message: "Received S3 event",
            event
        });

        const executions = event.Records.map(async (record) => {
            const params = {
                stateMachineArn: process.env.STATE_MACHINE_ARN,
                input: JSON.stringify({ lambdaEvent: record })
            };

            console.log({
                level: "info",
                requestId,
                message: "Starting Step Functions execution",
                params
            });

            const response = await stepFunctions.send(new StartExecutionCommand(params));
            return response;
        });

        const results = await Promise.all(executions);
        console.log({
            level: "info",
            requestId,
            message: "Step Functions executions started",
            results
        });

        return results;
    } catch (error) {
        console.error({
            level: "error",
            requestId,
            message: "Error starting Step Functions execution",
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
