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
/** @category Interface */
export interface SfnSucceedProps extends SucceedProps {
  name: string
}

/**
 */
/** @category Interface */
export interface SfnRetryProps extends RetryProps {
  intervalInSecs: number
}

/**
 */
/** @category Interface */
export interface SfnFailProps extends FailProps {
  name: string
}

/**
 */
/** @category Interface */
export interface SfnPassProps extends PassProps {
  name: string
}

/**
 */
/** @category Interface */
export interface SfnDynamoGetItemProps extends DynamoGetItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
/** @category Interface */
export interface SfnDynamoPutItemProps extends DynamoPutItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
/** @category Interface */
export interface SfnDynamoDeleteItemProps extends DynamoDeleteItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
/** @category Interface */
export interface SfnSqsSendMessageProps extends SqsSendMessageProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
/** @category Interface */
export interface SfnParallelProps extends ParallelProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
/** @category Interface */
export interface SfnChoiceProps extends ChoiceProps {
  name: string
}

/**
 */
/** @category Interface */
export interface SfnWaitProps extends WaitProps {
  name: string
  delayInSeconds: number
}

/**
 */
/** @category Interface */
export interface SfnLambdaInvokeProps extends LambdaInvokeProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
/** @category Interface */
export interface SfnCallApiGatewayRestApiEndpointProps extends CallApiGatewayRestApiEndpointProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 */
/** @category Interface */
export interface SfnStateMachineProps extends StateMachineProps {}

/**
 */
/** @category Interface */
export interface SfnMapProps extends MapProps {}

/**
 */
/** @category Interface */
export interface SfnStartExecutionProps extends StepFunctionsStartExecutionProps {
  retries?: SfnRetryProps[]
}
