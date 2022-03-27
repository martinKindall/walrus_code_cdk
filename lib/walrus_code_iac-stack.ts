import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class WalrusCodeIacStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const setupScript = ec2.UserData.forLinux();
    setupScript.addCommands('echo "Hello world from launch template in CDK!"');

    const launchTemplate = new ec2.LaunchTemplate(this, 'myLaunchTemplate', {
      userData: setupScript,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO)
    });
  }
}
