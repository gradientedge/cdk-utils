import { CommonStackProps } from '../../common'
import { AcmProps, LambdaEnvironment, LambdaProps } from '../../services'
import { LambdaRestApiProps } from 'aws-cdk-lib/aws-apigateway'
import { AssetCode } from 'aws-cdk-lib/aws-lambda'

/**
 * @deprecated Use RestApiLambdaEnvironment instead. This will be removed in a future release.
 */
export interface GraphQlApiLambdaEnvironment extends LambdaEnvironment {}

/**
 * @deprecated Use RestApiLambdaProps instead. This will be removed in a future release.
 */
export interface GraphQlApiLambdaProps extends CommonStackProps {
  apiRootPaths?: string[]
  apiSubDomain: string
  graphQLApiCertificate: AcmProps
  graphQLApiHandler: string
  graphQLApiSource: AssetCode
  graphqlApi: LambdaProps
  graphqlApiLambdaLayerSources?: AssetCode[]
  graphqlRestApi: LambdaRestApiProps
  logLevel: string
  nodeEnv: string
  timezone: string
  useExistingHostedZone: boolean
}
