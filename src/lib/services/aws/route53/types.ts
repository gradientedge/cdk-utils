import { HostedZoneProps } from 'aws-cdk-lib/aws-route53'

/**
 */
export interface Route53Props extends HostedZoneProps {
  useExistingHostedZone?: boolean
}
