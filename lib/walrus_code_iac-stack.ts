import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoScaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {Construct} from 'constructs';
import {Peer, Port} from "aws-cdk-lib/aws-ec2";
import {HealthCheck} from "aws-cdk-lib/aws-autoscaling";

export class WalrusCodeIacStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const setupScript = ec2.UserData.forLinux();
        setupScript.addCommands(`service docker start
docker pull public.ecr.aws/f5n7q8r5/aws-spring-param-store
mkdir ~/app_logs
chmod -R 777 ~/app_logs
docker run -p 80:8080 --name testB -d \\
-v ~/app_logs:/app_logs \\
--env serverId=$(hostname -f) \\
public.ecr.aws/f5n7q8r5/aws-spring-param-store
`);
        const iamRole = iam.Role.fromRoleArn(this,
            'myIamRole',
            `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT}:instance-profile/AWSCloudwatchRoleForEC2`);
        const t2micro = ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO);
        const machineImage = ec2.MachineImage.lookup({
            name: 'ami-linux-2-docker'
        });
        const vpc = ec2.Vpc.fromLookup(this, 'vpc-34818c4e', {isDefault: true});

        const targetGroup = new elbv2.ApplicationTargetGroup(this, 'myTargetGroup', {
            targetType: elbv2.TargetType.INSTANCE,
            port: 80,
            vpc,
            healthCheck: {
                path: '/actuator/health'
            }
        });

        const alb = new elbv2.ApplicationLoadBalancer(this, 'myAlb', {
            vpc,
            internetFacing: true
        });
        const listener = alb.addListener('listener', {port: 80});
        listener.addTargetGroups('target', {targetGroups: [targetGroup]});

        const sshSg = new ec2.SecurityGroup(this, 'mySshSg', {
            vpc
        });
        sshSg.addIngressRule(Peer.anyIpv4(), Port.tcp(22));
        const asg = new autoScaling.AutoScalingGroup(this, 'myAsg', {
            vpc: vpc,
            instanceType: t2micro,
            machineImage: machineImage,
            role: iamRole,
            keyName: 'codigo-morsa',
            minCapacity: 1,
            maxCapacity: 2,
            desiredCapacity: 1,
            healthCheck: HealthCheck.elb({
                grace: Duration.minutes(6)
            }),
            userData: setupScript
        });

        asg.attachToApplicationTargetGroup(targetGroup);
        asg.addSecurityGroup(sshSg);
    }
}
