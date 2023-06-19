import { AcmProps, LambdaEnvironment, LambdaProps, LambdaRestApiProps } from '../../services'
import { CommonStackProps } from '../../common'
import { AssetCode } from 'aws-cdk-lib/aws-lambda'

/**
 * @category cdk-utils.rest-api-lambda
 * @subcategory Types
 */
export interface RestApiLambdaEnvironment extends LambdaEnvironment {}

/**
 * @category cdk-utils.rest-api-lambda
 * @subcategory Properties
 */
export interface RestApiLambdaProps extends CommonStackProps {
  apiRootPaths?: string[]
  apiSubDomain: string
  restApiCertificate: AcmProps
  restApi: LambdaRestApiProps
  restApiLambdaLayerSources?: AssetCode[]
  restApiHandler: string
  restApiSource: AssetCode
  restApiLambda: LambdaProps
  useExistingHostedZone: boolean
  nodeEnv: string
  logLevel: string
  timezone: string
}
