# with-ec2-only -> We've got a static EIP
Build the squid Docker image from ./docker directory, push it to ECR.
Deploy an ECS (EC2 mode) with ASG for EC2 self healing.
Deploy an EIP and attach to the EC2.
Deploy a Lambda function triggered by the EventBridge (TaskStateChangeRule) that if
the EC2 instance is replaced due to unhealthy status, the Lambda function will be executed
to attach the same EIP to the new EC2 instance created by the ASG.

# with-nlb-for-static-dns-name -> We've got a static DNS name from the NLB
Build the squid Docker image from ./docker directory, push it to ECR.
Deploy an ECS (EC2 mode) with ASG for EC2 self healing.
Attach a NLB to the ASG for the static DNS name (higher monthly cost)

# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

* `npm install`   install required libraries
* `aws configure`   setup aws account for cdk

## Start Docker Desktop before running cdk deploy to build Docker image