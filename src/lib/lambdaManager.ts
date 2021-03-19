import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { CommonConstruct } from './commonConstruct'
import { LambdaProps } from './types'
import { createCfnOutput } from './genericUtils'

export class LambdaManager {
  public createLambdaLayer(id: string, scope: CommonConstruct, code: lambda.AssetCode) {
    const lambdaLayer = new lambda.LayerVersion(scope, `${id}`, {
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
      code: code,
      description: `${id}`,
      layerVersionName: `${id}-${scope.props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
  }

  public createLambdaFunction(
    id: string,
    scope: CommonConstruct,
    role: iam.Role | iam.CfnRole,
    layers: lambda.ILayerVersion[],
    code: lambda.AssetCode,
    environment?: any,
    vpc?: ec2.IVpc
  ) {
    if (!scope.props.lambdas || scope.props.lambdas.length == 0) throw `Lambda props undefined`

    const lambdaProps = scope.props.lambdas.find((lambda: LambdaProps) => lambda.id === id)
    if (!lambdaProps) throw `Could not find lambda props for id:${id}`

    const functionName = `${lambdaProps.functionName}-${scope.props.stage}`
    const lambdaFunction = new lambda.Function(scope, `${id}`, {
      allowPublicSubnet: !!vpc,
      functionName: functionName,
      handler: 'index.lambda_handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      code: code,
      environment: {
        REGION: scope.props.region,
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
      vpc: vpc,
    })

    createCfnOutput(`${id}Arn`, scope, lambdaFunction.functionArn)

    return lambdaFunction
  }
}
