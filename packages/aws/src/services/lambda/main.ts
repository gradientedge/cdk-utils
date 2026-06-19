import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib'
import { experimental } from 'aws-cdk-lib/aws-cloudfront'
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2'
import { IAccessPoint } from 'aws-cdk-lib/aws-efs'
import { CfnRole, Role } from 'aws-cdk-lib/aws-iam'
import {
  Alias,
  Architecture,
  AssetCode,
  CfnVersion,
  DockerImageCode,
  DockerImageFunction,
  FileSystem,
  Function,
  ILayerVersion,
  IVersion,
  LayerVersion,
} from 'aws-cdk-lib/aws-lambda'
import { PredefinedMetric, ScalableTarget, ServiceNamespace } from 'aws-cdk-lib/aws-applicationautoscaling'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import _ from 'lodash'

import { CommonConstruct, CommonStack } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'
import { CloudFrontManager } from '../cloudfront/index.js'

import { FunctionWithAliases, LambdaAliasProps, LambdaEdgeProps, LambdaProps } from './types.js'

/**
 * Provides operations on AWS Lambda
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
 * @category Service
 */
export class LambdaManager {
  /**
   * @summary Method to create a lambda layer (nodejs)
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param code the asset code for the layer
   * @param architectures optional list of compatible architectures, defaults to ARM_64
   */
  public createLambdaLayer(id: string, scope: CommonConstruct, code: AssetCode, architectures?: Architecture[]) {
    const lambdaLayer = new LayerVersion(scope, `${id}`, {
      code: code,
      compatibleArchitectures: architectures ?? [Architecture.ARM_64],
      compatibleRuntimes: [scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME],
      description: `${id}`,
      layerVersionName: scope.resourceNameFormatter.format(id, scope.props.resourceNameOptions?.lambdaLayer),
    })

    createCfnOutput(`${id}-lambdaLayerArn`, scope, lambdaLayer.layerVersionArn)

    return lambdaLayer
  }

  /**
   * @summary Method to create Lambda Web Adapter layers for both x86_64 and ARM64 architectures
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   */
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
   * @param props the Lambda function properties
   * @param role the IAM role for the function execution
   * @param layers the list of Lambda layers to attach
   * @param code the asset code for the function
   * @param handler optional handler entry point, defaults to 'index.lambda_handler'
   * @param environment optional environment variables to inject
   * @param vpc optional VPC to place the function in
   * @param securityGroups optional security groups when running in a VPC
   * @param accessPoint optional EFS access point for file system mounting
   * @param mountPath optional mount path for the EFS file system, defaults to '/mnt/msg'
   * @param vpcSubnets optional subnet selection when running in a VPC
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
    if (!props) throw new Error(`Lambda props undefined for ${id}`)
    if (!props.functionName) throw new Error(`Lambda functionName undefined for ${id}`)

    const functionName = scope.resourceNameFormatter.format(
      props.functionName,
      scope.props.resourceNameOptions?.lambdaFunction
    )

    let deadLetterQueue
    if (props.deadLetterQueueEnabled) {
      const redriveQueue = scope.sqsManager.createRedriveQueueForLambda(`${id}-rdq`, scope, props)
      deadLetterQueue = scope.sqsManager.createDeadLetterQueueForLambda(`${id}-dlq`, scope, props, redriveQueue)
    }

    const lambdaFunction: FunctionWithAliases = new Function(scope, `${id}`, {
      ...props,
      /* When a VPC is provided, allow placement in public subnets (e.g. for NAT access) */
      allowPublicSubnet: !!vpc,
      architecture: props.architecture ?? Architecture.ARM_64,
      code,
      deadLetterQueue,
      environment: {
        LOG_LEVEL: props.logLevel,
        REGION: scope.props.region,
        STAGE: scope.props.stage,
        ...environment,
      },
      filesystem: accessPoint ? FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg') : undefined,
      functionName,
      handler: handler || 'index.lambda_handler',
      layers,
      logGroup: scope.logManager.createLogGroup(`${id}-log-group`, scope, {
        logGroupName: functionName,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: scope.props.logRetention ?? props.logRetentionInDays,
      }),
      /* Per-function concurrency takes precedence over the stack-wide default */
      reservedConcurrentExecutions:
        props.reservedConcurrentExecutions ?? scope.props.defaultReservedLambdaConcurrentExecutions,
      /* Only L2 Role is accepted here — CfnRole (L1) is not compatible with the Function construct */
      role: role instanceof Role ? role : undefined,
      runtime: props.runtime ?? scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME,
      securityGroups,
      timeout: props.timeoutInSecs ? Duration.seconds(props.timeoutInSecs) : Duration.minutes(15),
      tracing: scope.props.defaultTracing ?? props.tracing,
      vpc,
      vpcSubnets,
    })

    /* When DLQ retries are enabled, wire the DLQ back as an SQS event source
       so failed messages are automatically reprocessed by the same function */
    if (lambdaFunction.deadLetterQueue && props.dlq?.retriesEnabled) {
      lambdaFunction.addEventSource(
        new SqsEventSource(lambdaFunction.deadLetterQueue, {
          batchSize: props.dlq.retryBatchSize ?? 1,
          reportBatchItemFailures: true,
        })
      )
    }

    /* Create aliases and optionally attach provisioned concurrency auto-scaling.
       Provisioned concurrency requires an alias — it cannot be set on $LATEST.
       The created Alias instances are also stashed on the returned function under
       `.lambdaAliases` (keyed by aliasName) so downstream constructs can use them
       directly instead of re-importing by ARN — which carries an UnclearLambdaEnvironment
       warning and silently drops permissions when CDK can't statically prove same-env. */
    if (props.lambdaAliases && !_.isEmpty(props.lambdaAliases)) {
      const aliasMap: Record<string, Alias> = {}
      props.lambdaAliases.forEach(alias => {
        const aliasId = alias.id ?? `${id}-${alias.aliasName}`
        const functionAlias = this.createLambdaFunctionAlias(`${aliasId}`, scope, alias, lambdaFunction.currentVersion)
        aliasMap[alias.aliasName] = functionAlias
        createCfnOutput(`${id}-${alias.aliasName}AliasArn`, scope, functionAlias.functionArn)
        createCfnOutput(`${id}-${alias.aliasName}AliasName`, scope, functionAlias.aliasName)

        if (alias.provisionedConcurrency) {
          if (alias.provisionedConcurrency.onVersion) {
            /* Attach PC + autoscaling to the published function VERSION rather
               than the alias. See ProvisionedConcurrencyProps.onVersion docs
               for the deploy-failure trap this exists to avoid. */
            this.attachProvisionedConcurrencyToVersion(
              `${aliasId}-pc`,
              scope,
              lambdaFunction,
              alias.provisionedConcurrency
            )
          } else {
            const functionAutoScaling = functionAlias.addAutoScaling(alias.provisionedConcurrency)
            functionAutoScaling.scaleOnUtilization({
              utilizationTarget: alias.provisionedConcurrency.utilizationTarget,
            })
          }
        }
      })
      lambdaFunction.lambdaAliases = aliasMap
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
  ): experimental.EdgeFunction {
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
   * @param props the Lambda function properties
   * @param role the IAM role for the function execution
   * @param code the Docker image code for the function
   * @param environment optional environment variables to inject
   * @param vpc optional VPC to place the function in
   * @param securityGroups optional security groups when running in a VPC
   * @param accessPoint optional EFS access point for file system mounting
   * @param mountPath optional mount path for the EFS file system, defaults to '/mnt/msg'
   * @param vpcSubnets optional subnet selection when running in a VPC
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
    if (!props) throw new Error(`Lambda props undefined for ${id}`)
    if (!props.functionName) throw new Error(`Lambda functionName undefined for ${id}`)

    const functionName = scope.resourceNameFormatter.format(
      props.functionName,
      scope.props.resourceNameOptions?.lambdaFunction
    )

    /* Optionally provision a dead letter queue with a redrive queue for failed invocations */
    let deadLetterQueue
    if (props.deadLetterQueueEnabled) {
      const redriveQueue = scope.sqsManager.createRedriveQueueForLambda(`${id}-rdq`, scope, props)
      deadLetterQueue = scope.sqsManager.createDeadLetterQueueForLambda(`${id}-dlq`, scope, props, redriveQueue)
    }

    const lambdaFunction = new DockerImageFunction(scope, `${id}`, {
      ...props,
      allowPublicSubnet: !!vpc,
      architecture: props.architecture ?? Architecture.ARM_64,
      code,
      deadLetterQueue,
      environment: {
        LOG_LEVEL: props.logLevel,
        REGION: scope.props.region,
        STAGE: scope.props.stage,
        ...environment,
      },
      filesystem: accessPoint ? FileSystem.fromEfsAccessPoint(accessPoint, mountPath || '/mnt/msg') : undefined,
      functionName,
      logGroup: scope.logManager.createLogGroup(`${id}-log-group`, scope, {
        logGroupName: functionName,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: scope.props.logRetention ?? props.logRetentionInDays,
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
   * @summary Method to create a lambda function alias
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the Lambda alias properties
   * @param lambdaVersion the Lambda function version to point the alias to
   */
  /**
   * @summary Attach provisioned concurrency + an autoscaling target to a Lambda
   * version (resource id `function:<fn>:<version>`) rather than an alias. The
   * version is warmed before the alias swap, and the alias itself carries no
   * PC config — so CFN alias updates remain atomic and never trip the
   * `Invalid alias configuration for Provisioned Concurrency` deploy failure
   * mode documented on {@link ProvisionedConcurrencyProps.onVersion}.
   * @param id scoped id prefix for the PC + scaling resources
   * @param scope scope the resources are added to
   * @param lambdaFunction the function whose currentVersion to attach PC to
   * @param props the PC + autoscaling props
   */
  protected attachProvisionedConcurrencyToVersion(
    id: string,
    scope: CommonConstruct,
    lambdaFunction: Function,
    props: { maxCapacity: number; minCapacity: number; utilizationTarget: number }
  ) {
    const version = lambdaFunction.currentVersion

    /* CDK doesn't expose AWS::Lambda::ProvisionedConcurrencyConfig as a
       standalone L1 — set PC inline on the published CfnVersion instead.
       Same CFN-level effect: PC attaches to the version, not the alias. */
    const cfnVersion = version.node.defaultChild as CfnVersion
    cfnVersion.provisionedConcurrencyConfig = {
      provisionedConcurrentExecutions: props.minCapacity,
    }

    const scalableTarget = new ScalableTarget(scope, `${id}-target`, {
      serviceNamespace: ServiceNamespace.LAMBDA,
      resourceId: `function:${lambdaFunction.functionName}:${version.version}`,
      scalableDimension: 'lambda:function:ProvisionedConcurrency',
      minCapacity: props.minCapacity,
      maxCapacity: props.maxCapacity,
    })
    scalableTarget.node.addDependency(version)

    scalableTarget.scaleToTrackMetric(`${id}-utilization`, {
      targetValue: props.utilizationTarget,
      predefinedMetric: PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
    })

    return scalableTarget
  }

  public createLambdaFunctionAlias(
    id: string,
    scope: CommonConstruct,
    props: LambdaAliasProps,
    lambdaVersion: IVersion
  ) {
    if (!props) throw new Error(`Lambda Alias props undefined for ${id}`)

    const lambdaFunctionAlias = new Alias(scope, `${id}`, {
      ...props,
      version: lambdaVersion,
    })

    createCfnOutput(`${id}-lambdaAliasName`, scope, lambdaFunctionAlias.functionArn)
    createCfnOutput(`${id}-lambdaAliasArn`, scope, lambdaFunctionAlias.functionName)

    return lambdaFunctionAlias
  }
}
