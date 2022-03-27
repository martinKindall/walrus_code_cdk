import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoScaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {Construct} from 'constructs';
import {IVpc, Peer, Port} from "aws-cdk-lib/aws-ec2";
import {HealthCheck} from "aws-cdk-lib/aws-autoscaling";
import {IRole} from "aws-cdk-lib/aws-iam/lib/role";

export class WalrusCodeIacStack extends Stack {
    private userData: ec2.UserData;
    private asgIamRole: IRole;
    private instanceType: ec2.InstanceType;
    private ec2Image: ec2.IMachineImage;
    private vpc: IVpc;
    private targetGroup: elbv2.ApplicationTargetGroup;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.setup();
        this.createTargetGroupAndAlb();
        this.createAsg();
    }

    setup() {
        this.userData = ec2.UserData.forLinux();
        this.userData.addCommands(`service docker start
docker pull public.ecr.aws/f5n7q8r5/aws-spring-param-store
mkdir ~/app_logs
chmod -R 777 ~/app_logs
docker run -p 80:8080 --name testB -d \\
-v ~/app_logs:/app_logs \\
--env serverId=$(hostname -f) \\
public.ecr.aws/f5n7q8r5/aws-spring-param-store
`);
        this.asgIamRole = iam.Role.fromRoleArn(this,
            'myIamRole',
            `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT}:instance-profile/AWSCloudwatchRoleForEC2`);
        this.instanceType = ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO);
        this.ec2Image = ec2.MachineImage.lookup({
            name: 'ami-linux-2-docker'
        });
        this.vpc = ec2.Vpc.fromLookup(this, 'vpc-34818c4e', {isDefault: true});
    }

    private createTargetGroupAndAlb() {
        this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'myTargetGroup', {
            targetType: elbv2.TargetType.INSTANCE,
            port: 80,
            vpc: this.vpc,
            healthCheck: {
                path: '/actuator/health'
            }
        });

        const alb = new elbv2.ApplicationLoadBalancer(this, 'myAlb', {
            vpc: this.vpc,
            internetFacing: true
        });
        const listener = alb.addListener('listener', {port: 80});
        listener.addTargetGroups('target', {targetGroups: [this.targetGroup]});
    }

    private createAsg() {
        const sshSg = new ec2.SecurityGroup(this, 'mySshSg', {
            vpc: this.vpc
        });
        sshSg.addIngressRule(Peer.anyIpv4(), Port.tcp(22));
        const asg = new autoScaling.AutoScalingGroup(this, 'myAsg', {
            vpc: this.vpc,
            instanceType: this.instanceType,
            machineImage: this.ec2Image,
            role: this.asgIamRole,
            keyName: 'codigo-morsa',
            minCapacity: 2,
            maxCapacity: 2,
            desiredCapacity: 2,
            healthCheck: HealthCheck.elb({
                grace: Duration.minutes(6)
            }),
            userData: this.userData,
        });

        asg.attachToApplicationTargetGroup(this.targetGroup);
        asg.addSecurityGroup(sshSg);
    }
}
