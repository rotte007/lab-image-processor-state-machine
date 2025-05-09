# lab-image-processor-state-machine
AWS Serverless

## Project Description

Automated, serverless image processing workflow to process user-uploaded images. Detect the file type, resize JPEG images, store metadata, and delete non-JPEG files.

![image](https://github.com/user-attachments/assets/9e77767d-c20c-4f4c-be72-44bad7f24795)

Built AWS Step Functions state machine that triggers on S3 uploads. The workflow determines the file type, process JPEGs in parallel by copying and resizing them using Lambda, and store metadata in DynamoDB. Non-JPEG files will be automatically deleted. To ensure reliability, implemented error handling and retries. Finally, tested the workflow by uploading images and reviewing execution logs.

![Screenshot 2025-05-09 002849](https://github.com/user-attachments/assets/0a3e72cd-2ddf-4b4d-ab0b-d594d42ae77b)
