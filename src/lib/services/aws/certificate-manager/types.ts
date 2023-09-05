import { CertificateProps } from 'aws-cdk-lib/aws-certificatemanager'

/**
 */
export interface AcmProps extends CertificateProps {
  certificateAccount?: string
  certificateArn?: string
  certificateId?: string
  certificateRegion?: string
  certificateSsmName?: string
  useExistingCertificate: boolean
}
