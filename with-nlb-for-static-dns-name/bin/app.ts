#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { SquidProxyStack } from '../lib/stacks/squid-proxy-stack';
import { appConfig } from '../config/app-config';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';
const config = appConfig.environments[environment];

if (!config) {
  throw new Error(`Configuration not found for environment: ${environment}`);
}

// Set environment
const env = config.account && config.region 
  ? { account: config.account, region: config.region }
  : { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

// Network Stack
const networkStack = new NetworkStack(app, 'NetworkStack', {
  env,
  environment,
  project: appConfig.project,
  vpcCidr: config.vpc.cidr,
  maxAzs: config.vpc.maxAzs,
});

// Combined Squid Proxy Stack (includes security resources)
const squidProxyStack = new SquidProxyStack(app, 'SquidProxyStack', {
  env,
  environment,
  project: appConfig.project,
  vpc: networkStack.vpc,
  securityGroup: networkStack.securityGroup,
  targetGroup: networkStack.targetGroup,
  keyPairName: config.keyPairName,
});