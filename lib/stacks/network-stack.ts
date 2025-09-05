import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';
import { NetworkStackProps } from '../interfaces/stack-props';

export class NetworkStack extends BaseStack {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;

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
  }
}