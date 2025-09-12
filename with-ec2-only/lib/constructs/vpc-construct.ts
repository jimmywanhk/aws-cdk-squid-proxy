import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  vpcName: string;
  vpcCidr: string;
  maxAzs: number;
  securityGroupName: string;
  elasticIpName: string;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly elasticIp: ec2.CfnEIP;

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

    // Create Elastic IP
    this.elasticIp = new ec2.CfnEIP(this, 'ElasticIP', {
      domain: 'vpc',
      tags: [
        {
          key: 'Name',
          value: props.elasticIpName,
        },
      ],
    });
  }
}