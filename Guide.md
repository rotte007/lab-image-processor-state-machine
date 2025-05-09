## Step Functions Workflow:
Ensures files are processed asynchronously in a scalable, serverless manner while handling errors gracefully.

The execution of our state machine begins with GetFileType. This is defined using the StartAt property, which sets GetFileType as the first state in the workflow. The state itself is a Task state, meaning it invokes a Lambda function. The Resource property uses arn:aws:states:::lambda:invoke, which is a service integration for invoking Lambda functions directly from Step Functions. The FunctionName is dynamically substituted at deployment using AWS SAM. InputPath is set to lambdaEvent. So lambdaEvent node from input JSON is passed to the Lambda function as event JSON. Response from Lambda function is added to the state output under the node results.fileType as defined by ResultPath.

Once GetFileType executes, the workflow moves to CheckFileType, which is a Choice state. This state checks whether the uploaded file is a JPEG (.jpg). If so, it proceeds to ProcessFile. Otherwise, it moves to DeleteSourceFile.

If the file is not a JPEG, it transitions to DeleteSourceFile. This state invokes a Lambda function that deletes the uploaded file from the S3 source bucket. The state has a timeout of 3 seconds and stores its result under $.results.deletionStatus. If successful, it marks the workflow as complete. OutputPath is set to results. So this only passes the results node to the state output, cutting out the rest of the input JSON.

If the file is a jpeg, it proceeds to ProcessFile, which is a Parallel state. This means two branches execute simultaneously: one to copy the file to a destination S3 bucket and another to resize the image. Each branch stores result in a separate ResultPath node under the image node, and image node is set as the OutputPath of these branches. So image node will contain the combined output of the two branches. This combined output is then set as a new node results.images in the state output of the ProcessFile state. Each branch defines retriers and catchers for error handling. QuitCopy and QuitResize states handle handle exceptions and failures gracefully.

At this point, the original file has been copied to the destination bucket and resized the image. Both results are stored in $.results.images, and the workflow proceeds to WriteToDynamoDB, which inserts the image metadata into a DynamoDB table. InputPath is set to the results node. So this Lambda function receives the results node as its event JSON. And the response from the Lambda function is set as a new node writeStatus under the results node of the state output.

The final step, DeleteSourceFile, ensures that the original uploaded file is deleted from the S3 source bucket after processing. Response of the Lambda function is stored under results.deletionStatus defined by ResultPath, and the state output is set to results node cutting out the rest of the state input JSON.

The QuitMain state handles any unhandled exceptions, ensuring a graceful termination of the workflow with an error message.

DefinitionUri: Points to the ASL file that defines the state machine.
Policies: Grants the state machine permission to invoke Lambda functions.
DefinitionSubstitutions are used to export Lambda function ARNs so that they can be referenced by the ASL file.
Logging defines the logging level and the CloudWatch log group
The Type is set to EXPRESS because this workflow is designed for short-duration, high-throughput executions that require low-latency processing. Express Workflows are cost-effective for rapid execution and automatically scale to handle bursts of requests while providing near real-time responses.

## Lambda functions

invokeImageProcessor - Triggering the Step Functions workflow
This function is triggered whenever a file is uploaded to the source S3 bucket. It starts the Step Functions execution by passing the event data to the state machine. Since multiple files can be uploaded at once, it loops through each event record and triggers the state machine separately. It logs the execution details for visibility and handles errors gracefully.

getFileType - Determining the file type
This function extracts the file extension from the uploaded file name. The result helps the Step Functions workflow determine if the file should be processed further or deleted. It logs the extracted file type for debugging.

copyFile - Copying the image to the destination bucket
This function copies the uploaded JPEG file from the source S3 bucket to the destination bucket. It ensures the image is stored safely before processing. It logs the copy operation and returns metadata about the copied file.

resizeImage - Resizing the image
This function resizes the uploaded image to 150px width using the Sharp library (deployed using a Lambda layer) and stores it in the destination bucket. It fetches the original image, processes it, and uploads the resized version with a -small suffix in the filename. Each step is logged for better observability.

writeToDynamoDB - Storing image metadata
This function writes the metadata of the original and resized images into a DynamoDB table. It ensures the processed files are tracked and accessible for future use. The metadata includes bucket names, file paths, and timestamps.

deleteFile - Deleting non-JPEG files
This function deletes non-JPEG files from the S3 source bucket to ensure only valid image files are processed. It logs the deletion action for tracking.

Handler: Specifies the function's entry point.
CodeUri: Defines the folder where the Lambda code is located.
Policies: Grants permissions to start Step Functions.
Environment: Passes the state machine ARN as an environment variable.
Events: Defines an S3 event that triggers the function whenever a new file is added to the source bucket.

S3FullAccessPolicy allows the function to read/write objects in S3.
The DESTINATION_BUCKET environment variable is set dynamically.
For ResizeImage, attach the Lambda layer SharpLayer
The Layers property attaches the Lambda layer.

## SAM Template
The template "template.yaml" includes:

The Step Functions state machine
The Lambda functions
The Lambda layer for the image processing library
IAM roles and permissions
Environment variables
A DynamoDB table and two S3 buckets

Transform - directive specifies that we're using AWS SAM.
Description - provides a brief overview of the template.
Parameters - define the template parameters to be specified during deployment
Globals -define common settings for all Lambda functions (runtime, memory, timeout, and X-Ray tracing).

## Lambda Layer
Package dependencies separately from your Lambda function code

LayerName: Defines the Lambda layer name.
ContentUri: Points to the folder containing the sharp library.
CompatibleRuntimes: Ensures compatibility with nodejs22.x.
