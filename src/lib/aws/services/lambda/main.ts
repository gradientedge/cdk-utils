import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib'
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2'
import { IAccessPoint } from 'aws-cdk-lib/aws-efs'
import { CfnRole, Role } from 'aws-cdk-lib/aws-iam'
import {
  Alias,
  Architecture,
  AssetCode,
  DockerImageCode,
  DockerImageFunction,
  FileSystem,
  Function,
  ILayerVersion,
  IVersion,
  LayerVersion,
} from 'aws-cdk-lib/aws-lambda'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import _ from 'lodash'
import { CommonConstruct, CommonStack } from '../../common'
import { createCfnOutput } from '../../utils'
import { CloudFrontManager } from '../cloudfront'
import { SsmManager } from '../systems-manager'
import { LambdaAliasProps, LambdaEdgeProps, LambdaProps } from './types'

/**
 * @classdesc Provides operations on AWS Lambda
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
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
   * @param architectures
   */
  public createLambdaLayer(id: string, scope: CommonConstruct, code: AssetCode, architectures?: Architecture[]) {
    const lambdaLayer = new LayerVersion(scope, `${id}`, {
      code: code,
      compatibleArchitectures: architectures ?? [Architecture.ARM_64],
      compatibleRuntimes: [scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME],
      description: `${id}`,
      layerVersionName: `${id}-${scope.props.stage}`,
    })

    createCfnOutput(`${id}-lambdaLayerArn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
  }

  public createWebAdapterLayer(id: string, scope: CommonConstruct) {
    return [
      LayerVersion.fromLayerVersionArn(
        scope,
        `${id}-${Architecture.X86_64}`,
        `arn:aws:lambda:${scope.props.region}:753240598075:layer:LambdaAdapterLayerX86:17`
      ),
      LayerVersion.fromLayerVersionArn(
        scope,
        `${id}-${Architecture.ARM_64}`,
        `arn:aws:lambda:${scope.props.region}:753240598075:layer:LambdaAdapterLayerArm64:17`
      ),
    ]
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
    role: Role | CfnRole,
    layers: ILayerVersion[],
    code: AssetCode,
    handler?: string,
    environment?: any,
    vpc?: IVpc,
    securityGroups?: ISecurityGroup[],
    accessPoint?: IAccessPoint,
    mountPath?: string,
    vpcSubnets?: SubnetSelection
  ) {
    if (!props) throw `Lambda props undefined for ${id}`
    if (!props.functionName) throw `Lambda functionName undefined for ${id}`

    const functionName = scope.resourceNameFormatter(props.functionName, props.resourceNameOptions)

    let deadLetterQueue
    if (props.deadLetterQueueEnabled) {
      const redriveQueue = scope.sqsManager.createRedriveQueueForLambda(`${id}-rdq`, scope, props)
      deadLetterQueue = scope.sqsManager.createDeadLetterQueueForLambda(`${id}-dlq`, scope, props, redriveQueue)
    }

    const { logRetention, ...lambdaProps } = props

    const lambdaFunction = new Function(scope, `${id}`, {
      ...lambdaProps,
      allowPublicSubnet: !!vpc,
      architecture: props.architecture ?? Architecture.ARM_64,
      code,
      deadLetterQueue,
      environment: {
        LAST_MODIFIED_TS: props.excludeLastModifiedTimestamp
          ? ''
          : scope.ssmManager.readStringParameter(
              `${id}-sm-ts`,
              scope,
              `${SsmManager.SECRETS_MODIFIED_TIMESTAMP_PARAM}-${scope.props.stage}`
            ),
        LOG_LEVEL: props.logLevel,
        REGION: scope.props.region,
        STAGE: scope.props.stage,
        ...environment,
      },
      filesystem: accessPoint ? FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg') : undefined,
      functionName,
      handler: handler || 'index.lambda_handler',
      layers,
      logGroup: new LogGroup(scope, `${id}-log-group`, {
        logGroupName: `/aws/lambda/${functionName}`,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: scope.props.logRetention ?? logRetention,
      }),
      reservedConcurrentExecutions:
        props.reservedConcurrentExecutions ?? scope.props.defaultReservedLambdaConcurrentExecutions,
      role: role instanceof Role ? role : undefined,
      runtime: props.runtime ?? scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME,
      securityGroups,
      timeout: props.timeoutInSecs ? Duration.seconds(props.timeoutInSecs) : Duration.minutes(15),
      tracing: scope.props.defaultTracing ?? props.tracing,
      vpc,
      vpcSubnets,
    })

    if (lambdaFunction.deadLetterQueue && props.dlq?.retriesEnabled) {
      lambdaFunction.addEventSource(
        new SqsEventSource(lambdaFunction.deadLetterQueue, {
          batchSize: props.dlq.retryBatchSize ?? 1,
          reportBatchItemFailures: true,
        })
      )
    }

    if (props.lambdaAliases && !_.isEmpty(props.lambdaAliases)) {
      props.lambdaAliases.forEach(alias => {
        const aliasId = alias.id ?? `${id}-${alias.aliasName}`
        const functionAlias = this.createLambdaFunctionAlias(`${aliasId}`, scope, alias, lambdaFunction.currentVersion)
        createCfnOutput(`${id}-${alias.aliasName}AliasArn`, scope, functionAlias.functionArn)
        createCfnOutput(`${id}-${alias.aliasName}AliasName`, scope, functionAlias.aliasName)

        if (alias.provisionedConcurrency) {
          const functionAutoScaling = functionAlias.addAutoScaling(alias.provisionedConcurrency)
          functionAutoScaling.scaleOnUtilization({
            utilizationTarget: alias.provisionedConcurrency.utilizationTarget,
          })
        }
      })
    }

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(lambdaFunction).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-lambdaArn`, scope, lambdaFunction.functionArn)
    createCfnOutput(`${id}-lambdaName`, scope, lambdaFunction.functionName)

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
    layers: ILayerVersion[],
    code: AssetCode,
    role: Role,
    environment?: any,
    vpc?: IVpc,
    securityGroups?: ISecurityGroup[],
    accessPoint?: IAccessPoint,
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
    role: Role | CfnRole,
    code: DockerImageCode,
    environment?: any,
    vpc?: IVpc,
    securityGroups?: ISecurityGroup[],
    accessPoint?: IAccessPoint,
    mountPath?: string,
    vpcSubnets?: SubnetSelection
  ) {
    if (!props) throw `Lambda props undefined for ${id}`
    if (!props.functionName) throw `Lambda functionName undefined for ${id}`

    const functionName = scope.resourceNameFormatter(props.functionName, props.resourceNameOptions)

    let deadLetterQueue
    if (props.deadLetterQueueEnabled) {
      const redriveQueue = scope.sqsManager.createRedriveQueueForLambda(`${id}-rdq`, scope, props)
      deadLetterQueue = scope.sqsManager.createDeadLetterQueueForLambda(`${id}-dlq`, scope, props, redriveQueue)
    }

    const { logRetention, ...lambdaProps } = props

    const lambdaFunction = new DockerImageFunction(scope, `${id}`, {
      ...lambdaProps,
      allowPublicSubnet: !!vpc,
      architecture: props.architecture ?? Architecture.ARM_64,
      code,
      deadLetterQueue,
      environment: {
        LAST_MODIFIED_TS: props.excludeLastModifiedTimestamp
          ? ''
          : scope.ssmManager.readStringParameter(
              `${id}-sm-ts`,
              scope,
              `${SsmManager.SECRETS_MODIFIED_TIMESTAMP_PARAM}-${scope.props.stage}`
            ),
        LOG_LEVEL: props.logLevel,
        REGION: scope.props.region,
        STAGE: scope.props.stage,
        ...environment,
      },
      filesystem: accessPoint ? FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg') : undefined,
      functionName,
      logGroup: new LogGroup(scope, `${id}-log-group`, {
        logGroupName: `/aws/lambda/${functionName}`,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: scope.props.logRetention ?? logRetention,
      }),
      role: role instanceof Role ? role : undefined,
      securityGroups: securityGroups,
      timeout: props.timeoutInSecs ? Duration.seconds(props.timeoutInSecs) : Duration.minutes(1),
      tracing: props.tracing,
      vpc,
      vpcSubnets,
    })

    if (lambdaFunction.deadLetterQueue && props.dlq?.retriesEnabled) {
      lambdaFunction.addEventSource(
        new SqsEventSource(lambdaFunction.deadLetterQueue, {
          batchSize: props.dlq.retryBatchSize ?? 1,
          reportBatchItemFailures: true,
        })
      )
    }

    createCfnOutput(`${id}-lambdaArn`, scope, lambdaFunction.functionArn)
    createCfnOutput(`${id}-lambdaName`, scope, lambdaFunction.functionName)

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

    const lambdaFunctionAlias = new Alias(scope, `${id}`, {
      ...props,
      version: lambdaVersion,
    })

    createCfnOutput(`${id}-lambdaAliasName`, scope, lambdaFunctionAlias.functionArn)
    createCfnOutput(`${id}-lambdaAliasArn`, scope, lambdaFunctionAlias.functionName)

    return lambdaFunctionAlias
  }
}
