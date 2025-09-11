import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface LogGroupConstructProps {
    logGroupName: string;
}

export class LogGroupConstruct extends Construct {
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: LogGroupConstructProps) {
    super(scope, id);
    
    //CloudWatch Logs
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
        logGroupName: props.logGroupName,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
  }
}