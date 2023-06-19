import * as lambda from 'aws-cdk-lib/aws-lambda'
import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'
import { LambdaEnvironment, LambdaProps } from '../../services'
import { CommonStackProps } from '../../common'

export interface LambdaWithIamAccessProps extends CommonStackProps {
  lambda: LambdaProps
  lambdaHandler?: string
  lambdaLayerSources: lambda.AssetCode[]
  lambdaSecret: SecretProps
  lambdaSource: lambda.AssetCode
  logLevel: string
  nodeEnv: string
  timezone: string
}

export interface LambdaWithIamAccessEnvironment extends LambdaEnvironment {}
