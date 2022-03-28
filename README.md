# Infrastructure as Code with the CDK

This is an example project where an Autoscaling Group targets an Application Load Balancer with a Target Group based on instances.
The docker image is built in this [other repository](https://github.com/martinKindall/aws_spring_cloud_sandbox).

The Cloud Development Kit version 2.x was used for this purpose. 

# Installation

- Install the CDK 2.X globally
- Create a .env file based on the .env.example
- npm install
- cdk synth 
- cdk diff
- cdk deploy
