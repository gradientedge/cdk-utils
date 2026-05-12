import * as ec2 from 'aws-cdk-lib/aws-ec2'

/**
 * Properties for configuring an AWS VPC.
 * @see [CDK VPC Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html}
 */
/** @category Interface */
export interface VpcProps extends ec2.VpcProps {
  /** Whether to create an IPv6-native VPC with dual-stack subnets */
  isIPV6?: boolean
}
