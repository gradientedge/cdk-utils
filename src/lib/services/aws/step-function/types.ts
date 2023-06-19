import {
  ChoiceProps,
  FailProps,
  MapProps,
  ParallelProps,
  PassProps,
  RetryProps,
  StateMachineProps,
  SucceedProps,
  WaitProps,
} from 'aws-cdk-lib/aws-stepfunctions'
import {
  CallApiGatewayRestApiEndpointProps,
  DynamoDeleteItemProps,
  DynamoGetItemProps,
  DynamoPutItemProps,
  LambdaInvokeProps,
  SqsSendMessageProps,
  StepFunctionsStartExecutionProps,
} from 'aws-cdk-lib/aws-stepfunctions-tasks'

/**
 */
export interface SfnSucceedProps extends SucceedProps {
  name: string
}

/**
 */
export interface SfnRetryProps extends RetryProps {
  intervalInSecs: number
}

/**
 */
export interface SfnFailProps extends FailProps {
  name: string
}

/**
 */
export interface SfnPassProps extends PassProps {
  name: string
}

/**
 */
export interface SfnDynamoGetItemProps extends DynamoGetItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
export interface SfnDynamoPutItemProps extends DynamoPutItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
export interface SfnDynamoDeleteItemProps extends DynamoDeleteItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
export interface SfnSqsSendMessageProps extends SqsSendMessageProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
export interface SfnParallelProps extends ParallelProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
export interface SfnChoiceProps extends ChoiceProps {
  name: string
}

/**
 */
export interface SfnWaitProps extends WaitProps {
  name: string
  delayInSeconds: number
}

/**
 */
export interface SfnLambdaInvokeProps extends LambdaInvokeProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
export interface SfnCallApiGatewayRestApiEndpointProps extends CallApiGatewayRestApiEndpointProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
export interface SfnStateMachineProps extends StateMachineProps {}

/**
 */
export interface SfnMapProps extends MapProps {}

/**
 */
export interface SfnStartExecutionProps extends StepFunctionsStartExecutionProps {
  retries?: SfnRetryProps[]
}
