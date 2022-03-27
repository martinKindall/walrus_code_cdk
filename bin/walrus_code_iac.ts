#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WalrusCodeIacStack } from '../lib/walrus_code_iac-stack';
import * as dotenv from 'dotenv';

dotenv.config();

const app = new cdk.App();
new WalrusCodeIacStack(app, 'WalrusCodeIacStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
