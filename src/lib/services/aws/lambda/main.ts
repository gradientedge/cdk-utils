import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { IVersion } from 'aws-cdk-lib/aws-lambda'
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources'
import * as utils from '../../../utils'
import { CommonConstruct, CommonStack } from '../../../common'
import { LambdaAliasProps, LambdaEdgeProps, LambdaProps } from './types'
import { CloudFrontManager } from '../cloudfront'
import { SsmManager } from '../systems-manager'

/**
 * @classdesc Provides operations on AWS Lambda.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.lambdaManager.createLambdaFunction('MyFunction', this, role, layers, code)
 *   }
 * }
 * @see [CDK Lambda Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html}
 */
export class LambdaManager {
  /**
   * @summary Method to create a lambda layer (nodejs)
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param code
   */
  public createLambdaLayer(id: string, scope: CommonConstruct, code: lambda.AssetCode) {
    const lambdaLayer = new lambda.LayerVersion(scope, `${id}`, {
      code: code,
      compatibleRuntimes: [scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME],
      description: `${id}`,
      layerVersionName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}-lambdaLayerArn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
  }

  /**
   * @summary Method to create a lambda function (nodejs)
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param role
   * @param layers
   * @param code
   * @param handler
   * @param environment
   * @param vpc
   * @param securityGroups
   * @param accessPoint
   * @param mountPath
   * @param vpcSubnets
   */
  public createLambdaFunction(
    id: string,
    scope: CommonConstruct,
    props: LambdaProps,
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
        architecture: props.architecture ?? lambda.Architecture.ARM_64,
        code: code,
        deadLetterQueue: deadLetterQueue,
        environment: {
          LAST_MODIFIED_TS: props.excludeLastModifiedTimestamp
            ? ''
            : scope.ssmManager.readStringParameter(
                `${id}-sm-ts`,
                scope,
                `${SsmManager.SECRETS_MODIFIED_TIMESTAMP_PARAM}-${scope.props.stage}`
              ),
          REGION: scope.props.region,
          STAGE: scope.props.stage,
          ...environment,
        },
        filesystem: accessPoint
          ? lambda.FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg')
          : undefined,
        functionName: functionName,
        handler: handler || 'index.lambda_handler',
        insightsVersion: props.insightsVersion,
        layers: layers,
        logRetention: scope.props.logRetention ?? props.logRetention,
        reservedConcurrentExecutions:
          props.reservedConcurrentExecutions ?? scope.props.defaultReservedLambdaConcurrentExecutions,
        role: role instanceof iam.Role ? role : undefined,
        runtime: props.runtime ?? scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME,
        securityGroups: securityGroups,
        timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(15),
        tracing: scope.props.defaultTracing ?? props.tracing,
        vpc,
        vpcSubnets,
      },
    })

    if (lambdaFunction.deadLetterQueue && props.dlq?.retriesEnabled) {
      lambdaFunction.addEventSource(
        new eventSources.SqsEventSource(lambdaFunction.deadLetterQueue, {
          batchSize: props.dlq.retryBatchSize ?? 1,
          reportBatchItemFailures: true,
        })
      )
    }

    if (props.lambdaAliases && props.lambdaAliases.length > 0) {
      props.lambdaAliases.forEach(alias => {
        const aliasId = alias.id ?? `${id}-${alias.aliasName}`
        const functionAlias = this.createLambdaFunctionAlias(`${aliasId}`, scope, alias, lambdaFunction.currentVersion)
        utils.createCfnOutput(`${id}-${alias.aliasName}AliasArn`, scope, functionAlias.functionArn)
        utils.createCfnOutput(`${id}-${alias.aliasName}AliasName`, scope, functionAlias.aliasName)

        if (alias.provisionedConcurrency) {
          const functionAutoScaling = functionAlias.addAutoScaling(alias.provisionedConcurrency)
          functionAutoScaling.scaleOnUtilization({
            utilizationTarget: alias.provisionedConcurrency.utilizationTarget,
          })
        }
      })
    }

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(lambdaFunction).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-lambdaArn`, scope, lambdaFunction.functionArn)
    utils.createCfnOutput(`${id}-lambdaName`, scope, lambdaFunction.functionName)

    return lambdaFunction
  }

  /**
   * @summary Method to provision a Lambda@Edge function
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props lambda@edge properties
   * @param layers
   * @param code
   * @param role
   * @param environment
   * @param vpc
   * @param securityGroups
   * @param accessPoint
   * @param mountPath
   */
  public createEdgeFunction(
    id: string,
    scope: CommonConstruct,
    props: LambdaEdgeProps,
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param role
   * @param code
   * @param environment
   * @param vpc
   * @param securityGroups
   * @param accessPoint
   * @param mountPath
   * @param vpcSubnets
   */
  public createLambdaDockerFunction(
    id: string,
    scope: CommonConstruct,
    props: LambdaProps,
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
        architecture: props.architecture ?? lambda.Architecture.ARM_64,
        code: code,
        deadLetterQueue: deadLetterQueue,
        environment: {
          LAST_MODIFIED_TS: props.excludeLastModifiedTimestamp
            ? ''
            : scope.ssmManager.readStringParameter(
                `${id}-sm-ts`,
                scope,
                `${SsmManager.SECRETS_MODIFIED_TIMESTAMP_PARAM}-${scope.props.stage}`
              ),
          REGION: scope.props.region,
          STAGE: scope.props.stage,
          ...environment,
        },
        filesystem: accessPoint
          ? lambda.FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg')
          : undefined,
        functionName: functionName,
        insightsVersion: props.insightsVersion,
        logRetention: scope.props.logRetention ?? props.logRetention,
        reservedConcurrentExecutions: props.reservedConcurrentExecutions,
        role: role instanceof iam.Role ? role : undefined,
        runtime: props.runtime ?? scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME,
        securityGroups: securityGroups,
        timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(1),
        tracing: props.tracing,
        vpc,
        vpcSubnets,
      },
    })

    if (lambdaFunction.deadLetterQueue && props.dlq?.retriesEnabled) {
      lambdaFunction.addEventSource(
        new eventSources.SqsEventSource(lambdaFunction.deadLetterQueue, {
          batchSize: props.dlq.retryBatchSize ?? 1,
          reportBatchItemFailures: true,
        })
      )
    }

    utils.createCfnOutput(`${id}-lambdaArn`, scope, lambdaFunction.functionArn)
    utils.createCfnOutput(`${id}-lambdaName`, scope, lambdaFunction.functionName)

    return lambdaFunction
  }

  /**
   * @summary Method to create a lambda function Alias
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param lambdaVersion
   */
  public createLambdaFunctionAlias(
    id: string,
    scope: CommonConstruct,
    props: LambdaAliasProps,
    lambdaVersion: IVersion
  ) {
    if (!props) throw `Lambda Alias props undefined for ${id}`

    const lambdaFunctionAlias = new lambda.Alias(scope, `${id}`, {
      ...props,
      ...{
        additionalVersions: props.additionalVersions,
        aliasName: props.aliasName,
        description: props.description,
        maxEventAge: props.maxEventAge,
        onFailure: props.onFailure,
        onSuccess: props.onSuccess,
        provisionedConcurrentExecutions: props.provisionedConcurrentExecutions,
        retryAttempts: props.retryAttempts,
        version: lambdaVersion,
      },
    })

    utils.createCfnOutput(`${id}-lambdaAliasName`, scope, lambdaFunctionAlias.functionArn)
    utils.createCfnOutput(`${id}-lambdaAliasArn`, scope, lambdaFunctionAlias.functionName)

    return lambdaFunctionAlias
  }
}