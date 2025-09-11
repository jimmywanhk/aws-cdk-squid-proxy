import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

export interface SquidClusterProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
  instanceRole: iam.IRole;
  keyName: string;
  instanceType?: string;
  minCapacity?: number;
  maxCapacity?: number;
  desiredCapacity?: number;
  createResourceName: (name: string) => string;
}

export class SquidCluster extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: SquidClusterProps) {
    super(scope, id);

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: props.createResourceName('squid-proxy-cluster'),
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc: props.vpc,
      instanceType: new ec2.InstanceType(props.instanceType || 't3.micro'),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
      securityGroup: props.securityGroup,
      role: props.instanceRole,
      keyName: props.keyName,
      desiredCapacity: props.desiredCapacity || 1,
      minCapacity: props.minCapacity || 1,
      maxCapacity: props.maxCapacity || 1,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      associatePublicIpAddress: true,
    });

    // Capacity Provider
    const capacityProvider = new ecs.AsgCapacityProvider(this, 'CapacityProvider', {
      autoScalingGroup: this.autoScalingGroup,
      capacityProviderName: props.createResourceName('squid-capacity-provider'),
    });

    this.cluster.addAsgCapacityProvider(capacityProvider);
  }
}