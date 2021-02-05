import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface LambdaProps extends lambda.FunctionProps {
  key: string
  timeoutInSecs?: number
}

export class LambdaManager {
  public createLambdaLayer(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    code: lambda.AssetCode
  ) {
    const lambdaLayer = new lambda.LayerVersion(scope, `${id}`, {
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
      code: code,
      description: `${id}`,
      layerVersionName: `${id}-${props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
  }

  public createLambdaFunction(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    role: iam.Role | iam.CfnRole,
    layers: lambda.LayerVersion[],
    code: lambda.AssetCode,
    environment?: any
  ) {
    if (!props.lambdas || props.lambdas.length == 0) throw `Lambda props undefined`

    const lambdaProps = props.lambdas.find((lambda: LambdaProps) => lambda.key === key)
    if (!lambdaProps) throw `Could not find lambda props for key:${key}`

    const functionName = `${lambdaProps.functionName}-${props.stage}`
    const lambdaFunction = new lambda.Function(scope, `${id}`, {
      functionName: functionName,
      handler: 'index.lambda_handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      code: code,
      environment: {
        REGION: props.region,
        ...environment,
      },
      layers: layers,
      logRetention: lambdaProps.logRetention,
      memorySize: lambdaProps.memorySize,
      reservedConcurrentExecutions: lambdaProps.reservedConcurrentExecutions,
      role: role instanceof iam.Role ? role : undefined,
      timeout: lambdaProps.timeoutInSecs
        ? cdk.Duration.seconds(lambdaProps.timeoutInSecs)
        : cdk.Duration.minutes(1),
    })

    createCfnOutput(`${id}Arn`, scope, lambdaFunction.functionArn)

    return lambdaFunction
  }
}
