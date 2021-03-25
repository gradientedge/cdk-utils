import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { CommonConstruct } from './commonConstruct'
import { LambdaProps } from './types'
import { createCfnOutput } from './genericUtils'

/**
 * @category Compute
 * @summary Provides operations on AWS Lambda.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.lambdaManager.createLambdaFunction('MyFunction', this, role, layers, code)
 * }
 *
 * @see [CDK Lambda Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html}</li></i>
 */
export class LambdaManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {lambda.AssetCode} code
   */
  public createLambdaLayer(id: string, scope: CommonConstruct, code: lambda.AssetCode) {
    const lambdaLayer = new lambda.LayerVersion(scope, `${id}`, {
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      code: code,
      description: `${id}`,
      layerVersionName: `${id}-${scope.props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {iam.Role | iam.CfnRole} role
   * @param {lambda.ILayerVersion[]} layers
   * @param {lambda.AssetCode} code
   * @param {Map<string, string>} environment
   * @param {ec2.IVpc} vpc
   */
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
