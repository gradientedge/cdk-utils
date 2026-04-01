import { StringParameterProps } from 'aws-cdk-lib/aws-ssm'

/**
 */
export interface SSMParameterReaderProps {
  parameterName: string
  region: string
}

export interface SSMStringParameterProps extends StringParameterProps {}
