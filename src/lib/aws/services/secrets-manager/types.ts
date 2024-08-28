import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'
import { ResourceNameFormatterProps } from '../../common'

export interface SecretBaseProps extends SecretProps {
  resourceNameOptions?: ResourceNameFormatterProps
}
