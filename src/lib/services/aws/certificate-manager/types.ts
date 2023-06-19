import * as acm from 'aws-cdk-lib/aws-certificatemanager'

/**
 */
export interface AcmProps extends acm.CertificateProps {
  certificateAccount?: string
  certificateArn?: string
  certificateId?: string
  certificateRegion?: string
  certificateSsmName?: string
  useExistingCertificate: boolean
}
