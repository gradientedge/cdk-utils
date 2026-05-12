import { AssetCode, LambdaInsightsVersion } from 'aws-cdk-lib/aws-lambda'
import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'

import { CommonStackProps } from '../../common/index.js'
import { LambdaEnvironment, LambdaProps } from '../../services/index.js'

/**
 * Properties for configuring a {@link LambdaWithIamAccess} construct
 */
/** @category Interface */
export interface LambdaWithIamAccessProps extends CommonStackProps {
  /** Whether to enable AppConfig integration for the Lambda function */
  configEnabled?: boolean
  /** The Lambda function configuration */
  lambda: LambdaProps
  /** The Lambda handler entry point (defaults to 'index.handler') */
  lambdaHandler?: string
  /** The Lambda Insights layer version for enhanced monitoring */
  lambdaInsightsVersion?: LambdaInsightsVersion
  /** The source code assets for Lambda layers */
  lambdaLayerSources: AssetCode[]
  /** The Secrets Manager secret configuration for storing IAM credentials */
  lambdaSecret: SecretProps
  /** The Lambda function source code asset */
  lambdaSource: AssetCode
  /** The application log level */
  logLevel: string
  /** The Node.js environment (e.g. development, production) */
  nodeEnv: string
  /** CloudFormation export name for an existing security group */
  securityGroupExportName?: string
  /** The timezone for the application */
  timezone: string
  /** Name of an existing VPC to look up */
  vpcName?: string
}

/**
 * Environment variables for the {@link LambdaWithIamAccess} Lambda function
 */
/** @category Interface */
export interface LambdaWithIamAccessEnvironment extends LambdaEnvironment {}
