import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamRoleConstruct extends Construct {
  public readonly ecsInstanceRole: iam.Role;
  public readonly ecsTaskExecutionRole: iam.Role;
  public readonly lambdaExecutionRole: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.ecsInstanceRole = new iam.Role(this, 'EcsInstanceRole', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
        ],
      });
  
    this.ecsTaskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Lambda execution role
    this.lambdaExecutionRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        EipManagement: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:DescribeInstances',
                'ec2:DescribeAddresses',
                'ec2:AssociateAddress',
                'ec2:DisassociateAddress',
                'ecs:DescribeTasks',
                'ecs:DescribeContainerInstances',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
  }
}