import { StringParameterProps } from 'aws-cdk-lib/aws-ssm'
import { ResourceNameFormatterProps } from '../../common'

/**
 */
export interface SSMParameterReaderProps {
  parameterName: string
  region: string
}

export interface SSMStringParameterProps extends StringParameterProps {}
