import { CommonStackProps } from '../../common'
import { AcmProps, LambdaEnvironment, LambdaProps } from '../../services'
import { LambdaRestApiProps } from 'aws-cdk-lib/aws-apigateway'
import { AssetCode } from 'aws-cdk-lib/aws-lambda'

/**
 * @deprecated Use RestApiLambdaEnvironment instead. This will be removed in a future release.
 * @category cdk-utils.graphql-api-lambda
 * @subcategory Types
 */
export interface GraphQlApiLambdaEnvironment extends LambdaEnvironment {}

/**
 * @deprecated Use RestApiLambdaProps instead. This will be removed in a future release.
 * @category cdk-utils.graphql-api-lambda
 * @subcategory Properties
 */
export interface GraphQlApiLambdaProps extends CommonStackProps {
  apiRootPaths?: string[]
  apiSubDomain: string
  graphQLApiCertificate: AcmProps
  graphqlRestApi: LambdaRestApiProps
  graphqlApiLambdaLayerSources?: AssetCode[]
  graphQLApiHandler: string
  graphQLApiSource: AssetCode
  graphqlApi: LambdaProps
  useExistingHostedZone: boolean
  nodeEnv: string
  logLevel: string
  timezone: string
}
