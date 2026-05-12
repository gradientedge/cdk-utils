import { AssetCode } from 'aws-cdk-lib/aws-lambda'

import { AcmProps, LambdaEnvironment, LambdaProps, LambdaRestApiProps } from '../../services/index.js'
import { CommonStackProps } from '../../common/index.js'

/**
 * Environment variables for the {@link RestApiLambda} Lambda function
 */
/** @category Interface */
export interface RestApiLambdaEnvironment extends LambdaEnvironment {}

/**
 * Properties for configuring a {@link RestApiLambda} construct
 */
/** @category Interface */
export interface RestApiLambdaProps extends CommonStackProps {
  /** Additional API root paths for base path mappings */
  apiRootPaths?: string[]
  /** The subdomain for the API Gateway custom domain */
  apiSubDomain: string
  /** The application log level */
  logLevel: string
  /** The Node.js environment (e.g. development, production) */
  nodeEnv: string
  /** The API Gateway REST API configuration */
  restApi: LambdaRestApiProps
  /** The SSL/TLS certificate configuration */
  restApiCertificate: AcmProps
  /** The Lambda handler entry point */
  restApiHandler: string
  /** The Lambda function configuration */
  restApiLambda: LambdaProps
  /** The source code assets for Lambda layers */
  restApiLambdaLayerSources?: AssetCode[]
  /** The Lambda function source code asset */
  restApiSource: AssetCode
  /** The timezone for the application */
  timezone: string
  /** Whether to look up an existing hosted zone instead of creating one */
  useExistingHostedZone: boolean
}
