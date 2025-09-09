import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface BaseStackProps extends cdk.StackProps {
  environment: string;
  project: string;
}

export interface NetworkStackProps extends BaseStackProps {
  vpcCidr?: string;
  maxAzs?: number;
}

export interface SquidProxyStackProps extends BaseStackProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
  targetGroup: elbv2.INetworkTargetGroup;
  keyPairName: string;
}