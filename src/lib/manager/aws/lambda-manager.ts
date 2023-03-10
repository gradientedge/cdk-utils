import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'
import { CloudFrontManager } from './cloudfront-manager'
import { SsmManager } from './ssm-manager'

/**
 * @stability stable
 * @category cdk-utils.lambda-manager
 * @subcategory Construct
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
  public static NODEJS_RUNTIME = lambda.Runtime.NODEJS_16_X

  /**
   * @summary Method to create a lambda layer (nodejs)
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {lambda.AssetCode} code
   */
  public createLambdaLayer(id: string, scope: common.CommonConstruct, code: lambda.AssetCode) {
    const lambdaLayer = new lambda.LayerVersion(scope, `${id}`, {
      compatibleRuntimes: [LambdaManager.NODEJS_RUNTIME],
      code: code,
      description: `${id}`,
      layerVersionName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}-lambdaLayerArn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
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
    if (!props) throw `Lambda props undefined for ${id}`

    const functionName = `${props.functionName}-${scope.props.stage}`

    let deadLetterQueue
    if (props.deadLetterQueueEnabled) {
      const redriveQueue = scope.sqsManager.createRedriveQueueForLambda(`${id}-rdq`, scope, props)
      deadLetterQueue = scope.sqsManager.createDeadLetterQueueForLambda(`${id}-dlq`, scope, props, redriveQueue)
    }

    const lambdaFunction = new lambda.Function(scope, `${id}`, {
      ...props,
      ...{
        allowPublicSubnet: !!vpc,
        functionName: functionName,
        handler: handler || 'index.lambda_handler',
        runtime: LambdaManager.NODEJS_RUNTIME,
        code: code,
        deadLetterQueue: deadLetterQueue,
        architecture: props.architecture ?? lambda.Architecture.ARM_64,
        environment: {
          REGION: scope.props.region,
          STAGE: scope.props.stage,
          LAST_MODIFIED_TS: props.excludeLastModifiedTimestamp
            ? ''
            : scope.ssmManager.readStringParameter(
                `${id}-sm-ts`,
                scope,
                `${SsmManager.SECRETS_MODIFIED_TIMESTAMP_PARAM}-${scope.props.stage}`
              ),
          ...environment,
        },
        filesystem: accessPoint
          ? lambda.FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg')
          : undefined,
        layers: layers,
        logRetention: scope.props.logRetention ?? props.logRetention,
        reservedConcurrentExecutions: props.reservedConcurrentExecutions,
        role: role instanceof iam.Role ? role : undefined,
        securityGroups: securityGroups,
        timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(15),
        vpc: vpc,
        vpcSubnets: vpcSubnets,
        tracing: props.tracing,
      },
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
   * @param {iam.Role} role
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
    role: iam.Role,
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
      role,
      environment,
      vpc,
      securityGroups,
      accessPoint,
      mountPath
    )
  }

  /**
   * @summary Method to create a lambda function (nodejs) with docker image
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LambdaProps} props
   * @param {iam.Role | iam.CfnRole} role
   * @param {lambda.DockerImageCode} code
   * @param {Map<string, string>?} environment
   * @param {ec2.IVpc?} vpc
   * @param {ec2.ISecurityGroup[]?} securityGroups
   * @param {efs.IAccessPoint?} accessPoint
   * @param {string?} mountPath
   * @param {ec2.SubnetSelection?} vpcSubnets
   */
  public createLambdaDockerFunction(
    id: string,
    scope: common.CommonConstruct,
    props: types.LambdaProps,
    role: iam.Role | iam.CfnRole,
    code: lambda.DockerImageCode,
    environment?: any,
    vpc?: ec2.IVpc,
    securityGroups?: ec2.ISecurityGroup[],
    accessPoint?: efs.IAccessPoint,
    mountPath?: string,
    vpcSubnets?: ec2.SubnetSelection
  ) {
    if (!props) throw `Lambda props undefined for ${id}`

    const functionName = `${props.functionName}-${scope.props.stage}`

    let deadLetterQueue
    if (props.deadLetterQueueEnabled) {
      const redriveQueue = scope.sqsManager.createRedriveQueueForLambda(`${id}-rdq`, scope, props)
      deadLetterQueue = scope.sqsManager.createDeadLetterQueueForLambda(`${id}-dlq`, scope, props, redriveQueue)
    }

    const lambdaFunction = new lambda.DockerImageFunction(scope, `${id}`, {
      ...props,
      ...{
        allowPublicSubnet: !!vpc,
        functionName: functionName,
        runtime: LambdaManager.NODEJS_RUNTIME,
        code: code,
        deadLetterQueue: deadLetterQueue,
        architecture: props.architecture ?? lambda.Architecture.ARM_64,
        environment: {
          REGION: scope.props.region,
          STAGE: scope.props.stage,
          LAST_MODIFIED_TS: props.excludeLastModifiedTimestamp
            ? ''
            : scope.ssmManager.readStringParameter(
                `${id}-sm-ts`,
                scope,
                `${SsmManager.SECRETS_MODIFIED_TIMESTAMP_PARAM}-${scope.props.stage}`
              ),
          ...environment,
        },
        filesystem: accessPoint
          ? lambda.FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg')
          : undefined,
        reservedConcurrentExecutions: props.reservedConcurrentExecutions,
        role: role instanceof iam.Role ? role : undefined,
        securityGroups: securityGroups,
        timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(1),
        vpc: vpc,
        vpcSubnets: vpcSubnets,
        tracing: props.tracing,
      },
    })

    utils.createCfnOutput(`${id}-lambdaArn`, scope, lambdaFunction.functionArn)
    utils.createCfnOutput(`${id}-lambdaName`, scope, lambdaFunction.functionName)

    return lambdaFunction
  }

  /**
   * @summary Method to create a lambda function Alias
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LambdaAliasProps} props
   * @param {types.LambdaAliasProps} lambdaVersion
   */
  public createLambdaFunctionAlias(
    id: string,
    scope: common.CommonConstruct,
    props: types.LambdaAliasProps,
    lambdaVersion: lambda.IVersion
  ) {
    if (!props) throw `Lambda Alias props undefined for ${id}`

    const lambdaFunctionAlias = new lambda.Alias(scope, `${id}`, {
      ...props,
      ...{
        aliasName: props.aliasName,
        version: lambdaVersion,
        additionalVersions: props.additionalVersions,
        description: props.description,
        maxEventAge: props.maxEventAge,
        onFailure: props.onFailure,
        onSuccess: props.onSuccess,
        provisionedConcurrentExecutions: props.provisionedConcurrentExecutions,
        retryAttempts: props.retryAttempts,
      },
    })

    utils.createCfnOutput(`${id}-lambdaAliasName`, scope, lambdaFunctionAlias.functionArn)
    utils.createCfnOutput(`${id}-lambdaAliasArn`, scope, lambdaFunctionAlias.functionName)

    return lambdaFunctionAlias
  }
}
