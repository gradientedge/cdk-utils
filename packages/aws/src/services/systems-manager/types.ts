import { StringParameterProps } from 'aws-cdk-lib/aws-ssm'

/**
 */
/** @category Interface */
export interface SSMParameterReaderProps {
  parameterName: string
  region: string
}

/** @category Interface */
export interface SSMStringParameterProps extends StringParameterProps {}
