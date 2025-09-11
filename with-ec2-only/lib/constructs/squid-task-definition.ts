import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';

export interface SquidTaskDefinitionProps {
  executionRole: iam.IRole;
  memoryLimitMiB?: number;
  memoryReservationMiB?: number;
  dockerDirectory?: string;
  createResourceName: (name: string) => string;
}

export class SquidTaskDefinition extends Construct {
  public readonly taskDefinition: ecs.Ec2TaskDefinition;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: SquidTaskDefinitionProps) {
    super(scope, id);

    // CloudWatch Log Group
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: props.createResourceName('/ecs/squid-proxy'),
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Definition
    this.taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDefinition', {
      executionRole: props.executionRole,
      networkMode: ecs.NetworkMode.BRIDGE,
    });

    // Docker Image Asset
    const squidImage = new assets.DockerImageAsset(this, 'Image', {
      directory: props.dockerDirectory || './docker',
    });

    // Container
    const container = this.taskDefinition.addContainer('squid-proxy', {
      image: ecs.ContainerImage.fromDockerImageAsset(squidImage),
      //memoryLimitMiB: props.memoryLimitMiB || 512,
      cpu: 2048, // 2 vCPU
      memoryReservationMiB: props.memoryReservationMiB || 512,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: this.logGroup,
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'squid -k check || exit 1'],
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(15),
        retries: 3,
        startPeriod: cdk.Duration.seconds(300),
      },
    });

    container.addPortMappings({
      containerPort: 3128,
      hostPort: 3128,
      protocol: ecs.Protocol.TCP,
    });
  }
}