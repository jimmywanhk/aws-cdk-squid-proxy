import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';

export interface EcrConstructProps {
  ecrRepositoryName: string;
  ecsTaskExecutionRole: iam.Role;
  dockerDirectory: string;
}

export class EcrConstruct extends Construct {
  public readonly ecrRepository: ecr.Repository;
  public readonly taskDefinition: ecs.Ec2TaskDefinition;
  public readonly dockerImage: assets.DockerImageAsset;

  constructor(scope: Construct, id: string, props: EcrConstructProps) {
    super(scope, id);

    // ECR Repository
    this.ecrRepository = new ecr.Repository(this, 'ECRRepository', {
      repositoryName: props.ecrRepositoryName,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Definition
    this.taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDefinition', {
      executionRole: props.ecsTaskExecutionRole,
      networkMode: ecs.NetworkMode.BRIDGE,
    });

    // Squid Docker Image Asset
    this.dockerImage = new assets.DockerImageAsset(this, 'Image', {
      directory: props.dockerDirectory,
    });
  }
}