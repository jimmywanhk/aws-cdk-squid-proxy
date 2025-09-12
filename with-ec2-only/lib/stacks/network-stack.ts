import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
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
  public readonly elasticIp: ec2.CfnEIP;

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
      elasticIpName: this.createResourceName('squid-eip'),
    });
    this.vpc = vpcConstruct.vpc;
    this.securityGroup = vpcConstruct.securityGroup;
    this.elasticIp = vpcConstruct.elasticIp;
    
    // Add EIP output
    new cdk.CfnOutput(this, 'ElasticIPOutput', {
      value: this.elasticIp.ref,
      description: 'Elastic IP for Squid Proxy',
      exportName: `${this.stackName}-Elastic-IP`,
    });
  }
}