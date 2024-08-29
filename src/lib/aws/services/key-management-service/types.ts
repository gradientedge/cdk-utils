import { KeyProps } from 'aws-cdk-lib/aws-kms'
import { ResourceNameFormatterProps } from '../../common'

/**
 */
export interface KmsKeyProps extends KeyProps {
  resourceNameOptions?: ResourceNameFormatterProps
}
