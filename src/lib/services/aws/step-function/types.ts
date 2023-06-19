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
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnSucceedProps extends SucceedProps {
  name: string
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnRetryProps extends RetryProps {
  intervalInSecs: number
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnFailProps extends FailProps {
  name: string
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnPassProps extends PassProps {
  name: string
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnDynamoGetItemProps extends DynamoGetItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnDynamoPutItemProps extends DynamoPutItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnDynamoDeleteItemProps extends DynamoDeleteItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnSqsSendMessageProps extends SqsSendMessageProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnParallelProps extends ParallelProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnChoiceProps extends ChoiceProps {
  name: string
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnWaitProps extends WaitProps {
  name: string
  delayInSeconds: number
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnLambdaInvokeProps extends LambdaInvokeProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnCallApiGatewayRestApiEndpointProps extends CallApiGatewayRestApiEndpointProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnStateMachineProps extends StateMachineProps {}

/**
 * @category cdk-utils.sfn-manager
 * @subcategory Properties
 */
export interface SfnMapProps extends MapProps {}

/**
 * @category cdk-utils.sfn-manager
 * @subcategory Properties
 */
export interface SfnStartExecutionProps extends StepFunctionsStartExecutionProps {
  retries?: SfnRetryProps[]
}
