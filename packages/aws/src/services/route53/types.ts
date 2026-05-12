import { HostedZoneProps } from 'aws-cdk-lib/aws-route53'

/**
 * Properties for configuring an AWS Route53 hosted zone.
 * @see [CDK Route53 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53-readme.html}
 */
/** @category Interface */
export interface Route53Props extends HostedZoneProps {
  /** Whether to look up an existing hosted zone instead of creating a new one */
  useExistingHostedZone?: boolean
}
