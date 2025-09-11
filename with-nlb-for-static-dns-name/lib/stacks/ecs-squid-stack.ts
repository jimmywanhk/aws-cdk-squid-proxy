import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';
import { BaseStackProps } from '../interfaces/base-stack-props';
import { IamRoleConstruct } from '../constructs/iam-role-construct';
import { EcsConstruct } from '../constructs/ecs-construct';
import { EcrConstruct } from '../constructs/ecr-construct';
import { LogGroupConstruct } from '../constructs/log-group-construct';

export interface EcsSquidStackProps extends BaseStackProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
  targetGroup: elbv2.INetworkTargetGroup;
  keyPairName: string;
  instanceType: string;
  cpu: number;
  memoryLimitMiB: number;
  memoryReservationMiB: number;
  minCapacity: number;
  maxCapacity: number;
  desiredCapacity: number;
}

export class EcsSquidStack extends BaseStack {
  constructor(scope: Construct, id: string, props: EcsSquidStackProps) {
    super(scope, id, props);

    // Create security resources first
    const keyPair = new ec2.CfnKeyPair(this, 'KeyPair', {
      keyName: props.keyPairName,
      keyType: 'rsa',
      keyFormat: 'pem',
    });

    const iamRoles = new IamRoleConstruct(this, 'IamRoles');

    const ecrConstruct = new EcrConstruct(this, 'ECR', {
      ecrRepositoryName: this.createResourceName('squid-proxy'),
      ecsTaskExecutionRole: iamRoles.ecsTaskExecutionRole,
      dockerDirectory: './docker',
    });

    const logGroup = new LogGroupConstruct(this, 'LogGroup', {
      logGroupName: this.createResourceName('/ecs/squid-proxy'),
    });

    // Squid Cluster
    const squidCluster = new EcsConstruct(this, 'Cluster', {
      ecsInstanceRole: iamRoles.ecsInstanceRole,
      logGroup: logGroup.logGroup,
      taskDefinition: ecrConstruct.taskDefinition,
      dockerImage: ecrConstruct.dockerImage,
      vpc: props.vpc,
      clusterName: this.createResourceName('squid-proxy-cluster'),
      instanceType: props.instanceType,
      securityGroup: props.securityGroup,
      targetGroup: props.targetGroup,
      keyName: props.keyPairName,
      cpu: props.cpu,
      minCapacity: props.minCapacity,
      maxCapacity: props.maxCapacity, 
      desiredCapacity: props.desiredCapacity,
      capacityProviderName: this.createResourceName('squid-capacity-provider'),
      memoryLimitMiB: props.memoryLimitMiB,
      memoryReservationMiB: props.memoryReservationMiB,
      ecsServiceName: this.createResourceName('squid-proxy-service'),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ECRRepositoryOutput', {
      value: ecrConstruct.ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${this.stackName}-ECR-Repository`,
    });

    new cdk.CfnOutput(this, 'ClusterNameOutput', {
      value: squidCluster.cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `${this.stackName}-Cluster-Name`,
    });
  }
}