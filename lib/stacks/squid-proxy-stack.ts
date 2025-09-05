import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';
import { SquidProxyStackProps } from '../interfaces/stack-props';
import { SquidCluster } from '../constructs/squid-cluster';
import { SquidTaskDefinition } from '../constructs/squid-task-definition';

export class SquidProxyStack extends BaseStack {
  public readonly ecrRepository: ecr.Repository;
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.Ec2Service;
  public readonly keyPair: ec2.CfnKeyPair;
  public readonly ecsInstanceRole: iam.Role;
  public readonly ecsTaskExecutionRole: iam.Role;

  constructor(scope: Construct, id: string, props: SquidProxyStackProps) {
    super(scope, id, props);

    // Create security resources first
    this.keyPair = new ec2.CfnKeyPair(this, 'KeyPair', {
      keyName: props.keyPairName,
      keyType: 'rsa',
      keyFormat: 'pem',
    });

    // IAM Roles
    this.ecsInstanceRole = new iam.Role(this, 'EcsInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
      ],
    });

    this.ecsTaskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // ECR Repository
    this.ecrRepository = new ecr.Repository(this, 'ECRRepository', {
      repositoryName: 'squid-proxy',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Squid Cluster
    const squidCluster = new SquidCluster(this, 'Cluster', {
      vpc: props.vpc,
      securityGroup: props.securityGroup,
      instanceRole: this.ecsInstanceRole,
      keyName: props.keyPairName,
    });
    this.cluster = squidCluster.cluster;

    // Task Definition
    const squidTaskDef = new SquidTaskDefinition(this, 'TaskDefinition', {
      executionRole: this.ecsTaskExecutionRole,
    });

    // ECS Service
    this.service = new ecs.Ec2Service(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: squidTaskDef.taskDefinition,
      serviceName: 'squid-proxy-service',
      desiredCount: 1,
      /*circuitBreaker: {
        rollback: true,
      },*/
      healthCheckGracePeriod: cdk.Duration.seconds(300),
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      placementStrategies: [
        ecs.PlacementStrategy.spreadAcrossInstances(),
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ECRRepositoryOutput', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${this.stackName}-ECR-Repository`,
    });

    new cdk.CfnOutput(this, 'ClusterNameOutput', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `${this.stackName}-Cluster-Name`,
    });
  }
}