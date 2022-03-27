import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as WalrusCodeIac from '../lib/walrus_code_iac-stack';

test('SQS Queue and SNS Topic Created', () => {
  const app = new cdk.App();
});
