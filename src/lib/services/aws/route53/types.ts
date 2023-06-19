import { HostedZoneProps } from 'aws-cdk-lib/aws-route53'

/**
 * @category cdk-utils.route53-manager
 * @subcategory Properties
 */
export interface Route53Props extends HostedZoneProps {
  useExistingHostedZone?: boolean
}
