import { CommonStackProps, LambdaEnvironment, LambdaProps } from '../../types'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { SecretProps } from 'aws-cdk-lib/aws-secretsmanager'

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
