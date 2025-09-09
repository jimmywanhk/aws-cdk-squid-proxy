import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStackProps } from '../interfaces/stack-props';

export abstract class BaseStack extends cdk.Stack {
  protected readonly envName: string; // Renamed from environment
  protected readonly project: string;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, {
      ...props,
      stackName: `${props.project}-${props.environment}-${id}`,
    });

    this.envName = props.environment; // Use envName instead
    this.project = props.project;

    // Apply common tags
    cdk.Tags.of(this).add('Environment', this.environment);
    cdk.Tags.of(this).add('Project', this.project);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }

  protected createResourceName(resourceType: string, suffix?: string): string {
    const parts = [this.project, this.environment, resourceType];
    if (suffix) parts.push(suffix);
    return parts.join('-');
  }
}