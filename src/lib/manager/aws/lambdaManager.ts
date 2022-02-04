import * as pylambda from '@aws-cdk/aws-lambda-python-alpha'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'
import { CloudFrontManager } from './cloudFrontManager'

/**
 * @stability stable
 * @category Compute
 * @classdesc Provides operations on AWS Lambda.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.lambdaManager.createLambdaFunction('MyFunction', this, role, layers, code)
 *   }
 * }
 *
 * @see [CDK Lambda Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html}
 */
export class LambdaManager {
  /**
   * @summary Method to create a lambda layer (nodejs)
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {lambda.AssetCode} code
   */
  public createLambdaLayer(id: string, scope: common.CommonConstruct, code: lambda.AssetCode) {
    const lambdaLayer = new lambda.LayerVersion(scope, `${id}`, {
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      code: code,
      description: `${id}`,
      layerVersionName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}-lambdaLayerArn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
  }

  /**
   * @summary Method to create a lambda layer (python)
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {string} entry path to layer source
   */
  public createPythonLambdaLayer(id: string, scope: common.CommonConstruct, entry: string) {
    const lambdaLayer = new pylambda.PythonLayerVersion(scope, `${id}`, {
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
      description: `${id}`,
      entry: entry,
      layerVersionName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}-lambdaLayerArn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
  }

  /**
   * @summary Method to create a lambda function (python)
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LambdaProps} props
   * @param {iam.Role | iam.CfnRole} role
   * @param {lambda.ILayerVersion[]} layers
   * @param {string} entry path to lambda source
   * @param {string?} index
   * @param {string?} handler
   * @param {Map<string, string>?} environment
   * @param {ec2.IVpc?} vpc
   * @param {ec2.ISecurityGroup[]?} securityGroups
   * @param {efs.IAccessPoint?} accessPoint
   * @param {string?} mountPath
   * @param {ec2.SubnetSelection?} vpcSubnets
   */

  public createPythonLambdaFunction(
    id: string,
    scope: common.CommonConstruct,
    props: types.LambdaProps,
    role: iam.Role | iam.CfnRole,
    layers: lambda.ILayerVersion[],
    entry: string,
    index?: string,
    handler?: string,
    environment?: any,
    vpc?: ec2.IVpc,
    securityGroups?: ec2.ISecurityGroup[],
    accessPoint?: efs.IAccessPoint,
    mountPath?: string,
    vpcSubnets?: ec2.SubnetSelection
  ) {
    if (!props) throw `Lambda props undefined`

    const functionName = `${props.functionName}-${scope.props.stage}`
    const lambdaFunction = new pylambda.PythonFunction(scope, `${id}`, {
      allowPublicSubnet: !!vpc,
      functionName: functionName,
      index: index,
      handler: handler,
      runtime: lambda.Runtime.PYTHON_3_8,
      entry: entry,
      environment: {
        REGION: scope.props.region,
        ...environment,
      },
      filesystem: accessPoint ? lambda.FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg') : undefined,
      layers: layers,
      logRetention: props.logRetention,
      memorySize: props.memorySize,
      onFailure: props.onFailure,
      onSuccess: props.onSuccess,
      reservedConcurrentExecutions: props.reservedConcurrentExecutions,
      role: role instanceof iam.Role ? role : undefined,
      securityGroups: securityGroups,
      timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(1),
      vpc: vpc,
      vpcSubnets: vpcSubnets,
    })

    utils.createCfnOutput(`${id}-lambdaArn`, scope, lambdaFunction.functionArn)
    utils.createCfnOutput(`${id}-lambdaName`, scope, lambdaFunction.functionName)

    return lambdaFunction
  }

  /**
   * @summary Method to create a lambda function (nodejs)
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LambdaProps} props
   * @param {iam.Role | iam.CfnRole} role
   * @param {lambda.ILayerVersion[]} layers
   * @param {lambda.AssetCode} code
   * @param {string?} handler
   * @param {Map<string, string>?} environment
   * @param {ec2.IVpc?} vpc
   * @param {ec2.ISecurityGroup[]?} securityGroups
   * @param {efs.IAccessPoint?} accessPoint
   * @param {string?} mountPath
   * @param {ec2.SubnetSelection?} vpcSubnets
   */
  public createLambdaFunction(
    id: string,
    scope: common.CommonConstruct,
    props: types.LambdaProps,
    role: iam.Role | iam.CfnRole,
    layers: lambda.ILayerVersion[],
    code: lambda.AssetCode,
    handler?: string,
    environment?: any,
    vpc?: ec2.IVpc,
    securityGroups?: ec2.ISecurityGroup[],
    accessPoint?: efs.IAccessPoint,
    mountPath?: string,
    vpcSubnets?: ec2.SubnetSelection
  ) {
    if (!props) throw `Lambda props undefined`

    const functionName = `${props.functionName}-${scope.props.stage}`
    const lambdaFunction = new lambda.Function(scope, `${id}`, {
      allowPublicSubnet: !!vpc,
      functionName: functionName,
      handler: handler || 'index.lambda_handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: code,
      environment: {
        REGION: scope.props.region,
        ...environment,
      },
      filesystem: accessPoint ? lambda.FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg') : undefined,
      layers: layers,
      logRetention: props.logRetention,
      memorySize: props.memorySize,
      onFailure: props.onFailure,
      onSuccess: props.onSuccess,
      reservedConcurrentExecutions: props.reservedConcurrentExecutions,
      role: role instanceof iam.Role ? role : undefined,
      securityGroups: securityGroups,
      timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(1),
      vpc: vpc,
      vpcSubnets: vpcSubnets,
    })

    utils.createCfnOutput(`${id}-lambdaArn`, scope, lambdaFunction.functionArn)
    utils.createCfnOutput(`${id}-lambdaName`, scope, lambdaFunction.functionName)

    return lambdaFunction
  }

  /**
   * @summary Method to provision a Lambda@Edge function
   *
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LambdaEdgeProps} props lambda@edge properties
   * @param {lambda.ILayerVersion[]} layers
   * @param {lambda.AssetCode} code
   * @param {Map<string, string>?} environment
   * @param {ec2.IVpc?} vpc
   * @param {ec2.ISecurityGroup[]?} securityGroups
   * @param {efs.IAccessPoint?} accessPoint
   * @param {string?} mountPath
   */
  public createEdgeFunction(
    id: string,
    scope: common.CommonConstruct,
    props: types.LambdaEdgeProps,
    layers: lambda.ILayerVersion[],
    code: lambda.AssetCode,
    environment?: any,
    vpc?: ec2.IVpc,
    securityGroups?: ec2.ISecurityGroup[],
    accessPoint?: efs.IAccessPoint,
    mountPath?: string
  ) {
    return new CloudFrontManager().createEdgeFunction(
      id,
      scope,
      props,
      layers,
      code,
      environment,
      vpc,
      securityGroups,
      accessPoint,
      mountPath
    )
  }
}
