import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  vpcName: string;
  vpcCidr: string;
  maxAzs: number;
  securityGroupName: string;
  loadBalancerName: string;
  targetGroupName: string;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly networkLoadBalancer: elbv2.NetworkLoadBalancer;
  public readonly targetGroup: elbv2.NetworkTargetGroup;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: props.vpcName,
      cidr: props.vpcCidr,
      maxAzs: props.maxAzs,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group for Squid Proxy
    this.securityGroup = new ec2.SecurityGroup(this, 'SquidSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: props.securityGroupName,
      description: 'Security group for Squid proxy',
      allowAllOutbound: true,
    });

    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3128),
      'Allow Squid proxy access from anywhere'
    );

    // Create Network Load Balancer
    this.networkLoadBalancer = new elbv2.NetworkLoadBalancer(this, 'SquidNLB', {
      vpc: this.vpc,
      internetFacing: true,
      loadBalancerName: props.loadBalancerName,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Create Target Group for Squid Proxy
    this.targetGroup = new elbv2.NetworkTargetGroup(this, 'SquidTargetGroup', {
      vpc: this.vpc,
      port: 3128,
      protocol: elbv2.Protocol.TCP,
      targetGroupName: props.targetGroupName,
      healthCheck: {
        enabled: true,
        port: '3128',
        protocol: elbv2.Protocol.TCP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
        interval: cdk.Duration.seconds(30),
      },
    });

    // Create Listener
    this.networkLoadBalancer.addListener('SquidListener', {
      port: 3128,
      protocol: elbv2.Protocol.TCP,
      defaultTargetGroups: [this.targetGroup],
    });
  }
}