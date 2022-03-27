#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WalrusCodeIacStack } from '../lib/walrus_code_iac-stack';

const app = new cdk.App();
new WalrusCodeIacStack(app, 'WalrusCodeIacStack');
