import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface EcsConstructProps {
  vpc: ec2.IVpc;
  clusterName: string;
  instanceType: string;
  securityGroup: ec2.ISecurityGroup;
  keyName: string;
  minCapacity: number;
  maxCapacity: number;
  desiredCapacity: number;
  capacityProviderName: string;
  cpu: number;
  memoryLimitMiB: number;
  memoryReservationMiB: number;
  ecsServiceName: string;
  ecsInstanceRole: iam.Role;
  logGroup: logs.LogGroup;
  taskDefinition: ecs.Ec2TaskDefinition;
  dockerImage: assets.DockerImageAsset;
}

export class EcsConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly capacityProvider: ecs.AsgCapacityProvider;
  public readonly service: ecs.Ec2Service;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: props.clusterName,
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc: props.vpc,
      instanceType: new ec2.InstanceType(props.instanceType),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
      securityGroup: props.securityGroup,
      role: props.ecsInstanceRole,
      keyName: props.keyName,
      desiredCapacity: props.desiredCapacity,
      minCapacity: props.minCapacity,
      maxCapacity: props.maxCapacity,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      associatePublicIpAddress: true,
    });
    cdk.Tags.of(this.autoScalingGroup).add('EIPManaged', 'true');

    // Capacity Provider
    this.capacityProvider = new ecs.AsgCapacityProvider(this, 'CapacityProvider', {
      autoScalingGroup: this.autoScalingGroup,
      capacityProviderName: props.capacityProviderName,
    });

    this.cluster.addAsgCapacityProvider(this.capacityProvider);

    // Container
    const container = props.taskDefinition.addContainer('squid-proxy', {
      image: ecs.ContainerImage.fromDockerImageAsset(props.dockerImage),
      //memoryLimitMiB: props.memoryLimitMiB,
      cpu: props.cpu,
      memoryReservationMiB: props.memoryReservationMiB,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: props.logGroup,
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

    // ECS Service
    this.service = new ecs.Ec2Service(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: props.taskDefinition,
      serviceName: props.ecsServiceName,
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
  }
}