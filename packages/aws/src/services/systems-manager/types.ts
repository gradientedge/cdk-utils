import { StringParameterProps } from 'aws-cdk-lib/aws-ssm'

/**
 * Properties for reading an SSM parameter, optionally from a cross-region parameter store.
 * @see [CDK SSM Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm-readme.html}
 */
/** @category Interface */
export interface SSMParameterReaderProps {
  /** The name of the SSM parameter to read */
  parameterName: string
  /** The AWS region from which to read the parameter */
  region: string
}

/**
 * Properties for configuring an AWS Systems Manager string parameter.
 * @see [CDK SSM Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm-readme.html}
 */
/** @category Interface */
export interface SSMStringParameterProps extends StringParameterProps {}
