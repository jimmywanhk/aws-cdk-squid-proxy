import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';
import { NetworkStackProps } from '../interfaces/stack-props';

export class NetworkStack extends BaseStack {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly networkLoadBalancer: elbv2.NetworkLoadBalancer;
  public readonly targetGroup: elbv2.NetworkTargetGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Disable default security group restrictions for this context
    this.node.setContext('@aws-cdk/aws-ec2:restrictDefaultSecurityGroup', false);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: this.createResourceName('vpc'),
      cidr: props.vpcCidr || '10.0.0.0/16',
      maxAzs: props.maxAzs || 2,
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
      securityGroupName: this.createResourceName('squid-sg'),
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
      loadBalancerName: 'squid-nlb', //this.createResourceName('squid-nlb'), name too long
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Create Target Group for Squid Proxy
    this.targetGroup = new elbv2.NetworkTargetGroup(this, 'SquidTargetGroup', {
      port: 3128,
      protocol: elbv2.Protocol.TCP,
      vpc: this.vpc,
      targetGroupName: 'squid-tg', //this.createResourceName('squid-tg'), name too long
      healthCheck: {
        enabled: true,
        protocol: elbv2.Protocol.TCP,
        port: '3128',
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

    // Output the NLB DNS name
    new cdk.CfnOutput(this, 'SquidProxyEndpoint', {
      value: this.networkLoadBalancer.loadBalancerDnsName,
      description: 'Network Load Balancer DNS name for Squid proxy',
      exportName: `${this.stackName}-NLB-DNS`,
    });
  }
}