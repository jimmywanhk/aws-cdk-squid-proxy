import * as cdk from 'aws-cdk-lib';

export interface BaseStackProps extends cdk.StackProps {
  environment: string;
  project: string;
}