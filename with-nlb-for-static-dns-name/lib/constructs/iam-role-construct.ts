import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamRoleConstruct extends Construct {
  public readonly ecsInstanceRole: iam.Role;
  public readonly ecsTaskExecutionRole: iam.Role;

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
  }
}