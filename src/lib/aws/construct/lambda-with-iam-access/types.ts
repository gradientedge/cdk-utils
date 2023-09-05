import { AssetCode } from 'aws-cdk-lib/aws-lambda'
import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'
import { CommonStackProps } from '../../common'
import { LambdaEnvironment, LambdaProps } from '../../services'

export interface LambdaWithIamAccessProps extends CommonStackProps {
  lambda: LambdaProps
  lambdaHandler?: string
  lambdaLayerSources: AssetCode[]
  lambdaSecret: SecretProps
  lambdaSource: AssetCode
  logLevel: string
  nodeEnv: string
  timezone: string
}

export interface LambdaWithIamAccessEnvironment extends LambdaEnvironment {}
