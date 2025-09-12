// constructs/eip-manager.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface EipManagerProps {
  cluster: ecs.ICluster;
  serviceName: string;
  eipAllocationId: string;
  lambdaExecutionRole: iam.IRole;
}

export class EipManager extends Construct {
  public readonly lambdaFunction: lambda.Function;
  public readonly eventRule: events.Rule;

  constructor(scope: Construct, id: string, props: EipManagerProps) {
    super(scope, id);

    // Lambda function
    this.lambdaFunction = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      role: props.lambdaExecutionRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        CLUSTER_NAME: props.cluster.clusterName,
        SERVICE_NAME: props.serviceName,
        EIP_ALLOCATION_ID: props.eipAllocationId,
      },
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda', 'eip-manager')),
      description: 'Manages EIP association for ECS tasks',
    });

    // EventBridge rule to capture ECS task state changes
    this.eventRule = new events.Rule(this, 'TaskStateChangeRule', {
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Task State Change'],
        detail: {
          clusterArn: [props.cluster.clusterArn],
          lastStatus: ['RUNNING'],
        },
      },
      description: 'Captures ECS task state changes for EIP management',
    });

    this.eventRule.addTarget(new targets.LambdaFunction(this.lambdaFunction));
  }
}