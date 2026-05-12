import { CertificateProps } from 'aws-cdk-lib/aws-certificatemanager'

/**
 * Props for creating or importing an ACM certificate.
 * @see {@link AcmManager.resolveCertificate}
 */
/** @category Interface */
export interface AcmProps extends CertificateProps {
  /** The AWS account ID where the certificate resides */
  certificateAccount?: string
  /** The full ARN of an existing certificate to import */
  certificateArn?: string
  /** The certificate ID used to construct an ARN when certificateArn is not provided */
  certificateId?: string
  /** The AWS region where the certificate resides */
  certificateRegion?: string
  /** The SSM parameter name storing the certificate reference */
  certificateSsmName?: string
  /** Whether to import an existing certificate instead of creating a new one */
  useExistingCertificate: boolean
}
