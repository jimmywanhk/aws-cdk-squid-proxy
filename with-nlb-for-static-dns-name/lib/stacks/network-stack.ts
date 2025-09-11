import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';
import { BaseStackProps } from '../interfaces/base-stack-props';
import { VpcConstruct } from '../constructs/vpc-construct';

export interface NetworkStackProps extends BaseStackProps {
  vpcCidr: string;
  maxAzs: number;
}

export class NetworkStack extends BaseStack {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly targetGroup: elbv2.NetworkTargetGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Disable default security group restrictions for this context
    // If set to true then the default inbound & outbound rules will be removed from the default security group.
    this.node.setContext('@aws-cdk/aws-ec2:restrictDefaultSecurityGroup', false);

    const vpcConstruct = new VpcConstruct(this, 'VPC', {
      vpcName: this.createResourceName('vpc'),
      vpcCidr: props.vpcCidr,
      maxAzs: props.maxAzs,
      securityGroupName: this.createResourceName('squid-sg'),
      loadBalancerName: this.createResourceName('squid-nlb'),
      targetGroupName: this.createResourceName('squid-tg'),
    });
    this.vpc = vpcConstruct.vpc;
    this.securityGroup = vpcConstruct.securityGroup;
    this.targetGroup = vpcConstruct.targetGroup;
    
    // Output the NLB DNS name
    new cdk.CfnOutput(this, 'SquidProxyEndpoint', {
      value: vpcConstruct.networkLoadBalancer.loadBalancerDnsName,
      description: 'Network Load Balancer DNS name for Squid proxy',
      exportName: `${this.stackName}-NLB-DNS`,
    });
  }
}