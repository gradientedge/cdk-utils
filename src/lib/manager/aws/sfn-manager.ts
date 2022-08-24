import * as cdk from 'aws-cdk-lib'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as common from '../../common'
import * as types from '../../types'
import { SfnStateMachineProps } from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.step-functions-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Step Functions Service.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.sfnManager.createSuccessStep('MyStep', this, myStepProps)
 *   }
 * }
 *
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
export class SfnManager {
  /**
   * @summary Method to create a success step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnSucceedProps} props
   */
  public createSuccessStep(id: string, scope: common.CommonConstruct, props: types.SfnSucceedProps) {
    if (!props) throw 'Step props undefined'
    return new sfn.Succeed(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Succeed step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a failure step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnFailProps} props
   */
  public createFailStep(id: string, scope: common.CommonConstruct, props: types.SfnFailProps) {
    if (!props) throw 'Step props undefined'
    return new sfn.Fail(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Fail step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a pass step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnPassProps} props
   */
  public createPassStep(id: string, scope: common.CommonConstruct, props: types.SfnPassProps) {
    if (!props) throw 'Step props undefined'
    return new sfn.Pass(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Pass step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a parallel step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnParallelProps} props
   */
  public createParallelStep(id: string, scope: common.CommonConstruct, props: types.SfnParallelProps) {
    if (!props) throw 'Step props undefined'
    return new sfn.Parallel(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Parallel step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a choice step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnChoiceProps} props
   */
  public createChoiceStep(id: string, scope: common.CommonConstruct, props: types.SfnChoiceProps) {
    if (!props) throw 'Step props undefined'
    return new sfn.Choice(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Choice step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a wait step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnWaitProps} props
   */
  public createWaitStep(id: string, scope: common.CommonConstruct, props: types.SfnWaitProps) {
    return new sfn.Wait(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Choice step for ${props.name} - ${scope.props.stage} stage`,
        time: sfn.WaitTime.duration(cdk.Duration.seconds(props.delayInSeconds)),
      },
    })
  }

  /**
   * @summary Method to create a lambda invoke step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnLambdaInvokeProps} props
   * @param {lambda.IFunction} lambdaFunction
   */
  public createLambdaStep(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnLambdaInvokeProps,
    lambdaFunction: lambda.IFunction
  ) {
    if (!props) throw 'Step props undefined'
    return new tasks.LambdaInvoke(scope, `${props.name}`, {
      ...props,
      ...{
        lambdaFunction,
        comment: `Lambda step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a API Gateway invoke step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnLambdaInvokeProps} props
   * @param {apig.IRestApi} api
   */
  public createApiStep(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnCallApiGatewayRestApiEndpointProps,
    api: apig.IRestApi
  ) {
    if (!props) throw 'Step props undefined'
    return new tasks.CallApiGatewayRestApiEndpoint(scope, `${props.name}`, {
      ...props,
      ...{
        api,
        stageName: scope.props.stage,
        comment: `API step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a state machine
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnStateMachineProps} props
   * @param {sfn.IChainable} definition
   * @param {logs.ILogGroup} logGroup
   * @param {iam.IRole} role
   */
  public createStateMachine(
    id: string,
    scope: common.CommonConstruct,
    props: SfnStateMachineProps,
    definition: sfn.IChainable,
    logGroup: logs.ILogGroup,
    role?: iam.IRole
  ) {
    if (!props) throw 'State Machine props undefined'
    const stateMachine = new sfn.StateMachine(scope, `${id}`, {
      stateMachineName: `${props.stateMachineName}-${scope.props.stage}`,
      definition,
      role,
      stateMachineType: props.stateMachineType,
      logs: {
        destination: logGroup,
        includeExecutionData: props.logs?.includeExecutionData ?? true,
        level: props.logs?.level ?? sfn.LogLevel.ALL,
      },
      tracingEnabled: props.tracingEnabled,
      timeout: props.timeout,
    })

    utils.createCfnOutput(`${id}-stateMachineName`, scope, stateMachine.stateMachineName)
    utils.createCfnOutput(`${id}-stateMachineArn`, scope, stateMachine.stateMachineArn)

    return stateMachine
  }
}
