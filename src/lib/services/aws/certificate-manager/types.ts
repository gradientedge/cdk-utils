import * as acm from 'aws-cdk-lib/aws-certificatemanager'

/**
 * @category cdk-utils.acm-manager
 * @subcategory Properties
 */
export interface AcmProps extends acm.CertificateProps {
  certificateSsmName?: string
  certificateAccount?: string
  certificateRegion?: string
  certificateId?: string
  certificateArn?: string
  useExistingCertificate: boolean
}
