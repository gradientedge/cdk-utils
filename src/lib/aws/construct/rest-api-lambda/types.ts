import { AcmProps, LambdaEnvironment, LambdaProps, LambdaRestApiProps } from '../../services/index.js'
import { CommonStackProps } from '../../common/index.js'
import { AssetCode } from 'aws-cdk-lib/aws-lambda'

/**
 */
export interface RestApiLambdaEnvironment extends LambdaEnvironment {}

/**
 */
export interface RestApiLambdaProps extends CommonStackProps {
  apiRootPaths?: string[]
  apiSubDomain: string
  logLevel: string
  nodeEnv: string
  restApi: LambdaRestApiProps
  restApiCertificate: AcmProps
  restApiHandler: string
  restApiLambda: LambdaProps
  restApiLambdaLayerSources?: AssetCode[]
  restApiSource: AssetCode
  timezone: string
  useExistingHostedZone: boolean
}
