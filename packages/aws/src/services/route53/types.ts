import { HostedZoneProps } from 'aws-cdk-lib/aws-route53'

/**
 */
/** @category Interface */
export interface Route53Props extends HostedZoneProps {
  useExistingHostedZone?: boolean
}
