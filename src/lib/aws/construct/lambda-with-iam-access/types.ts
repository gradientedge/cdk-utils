import { AssetCode, LambdaInsightsVersion } from 'aws-cdk-lib/aws-lambda'
import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'
import { CommonStackProps } from '../../common/index.js'
import { LambdaEnvironment, LambdaProps } from '../../services/index.js'

export interface LambdaWithIamAccessProps extends CommonStackProps {
  configEnabled?: boolean
  lambda: LambdaProps
  lambdaHandler?: string
  lambdaInsightsVersion?: LambdaInsightsVersion
  lambdaLayerSources: AssetCode[]
  lambdaSecret: SecretProps
  lambdaSource: AssetCode
  logLevel: string
  nodeEnv: string
  securityGroupExportName?: string
  timezone: string
  vpcName?: string
}

export interface LambdaWithIamAccessEnvironment extends LambdaEnvironment {}
