import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'

/**
 * Properties for configuring an AWS Secrets Manager secret.
 * @see [CDK Secrets Manager Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager-readme.html}
 */
/** @category Interface */
export interface SecretBaseProps extends SecretProps {}
