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
 * Properties for configuring a Step Functions succeed state.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnSucceedProps extends SucceedProps {
  /** The name of the step */
  name: string
}

/**
 * Properties for configuring retry behaviour on a Step Functions step.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnRetryProps extends RetryProps {
  /** Interval in seconds between retries */
  intervalInSecs: number
}

/**
 * Properties for configuring a Step Functions fail state.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnFailProps extends FailProps {
  /** The name of the step */
  name: string
}

/**
 * Properties for configuring a Step Functions pass state.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnPassProps extends PassProps {
  /** The name of the step */
  name: string
}

/**
 * Properties for configuring a DynamoDB GetItem step in a Step Functions workflow.
 * @see [CDK Step Functions Tasks Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks-readme.html}
 */
/** @category Interface */
export interface SfnDynamoGetItemProps extends DynamoGetItemProps {
  /** The name of the step */
  name: string
  /** Retry configuration for the step */
  retries?: SfnRetryProps[]
}

/**
 * Properties for configuring a DynamoDB PutItem step in a Step Functions workflow.
 * @see [CDK Step Functions Tasks Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks-readme.html}
 */
/** @category Interface */
export interface SfnDynamoPutItemProps extends DynamoPutItemProps {
  /** The name of the step */
  name: string
  /** Retry configuration for the step */
  retries?: SfnRetryProps[]
}

/**
 * Properties for configuring a DynamoDB DeleteItem step in a Step Functions workflow.
 * @see [CDK Step Functions Tasks Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks-readme.html}
 */
/** @category Interface */
export interface SfnDynamoDeleteItemProps extends DynamoDeleteItemProps {
  /** The name of the step */
  name: string
  /** Retry configuration for the step */
  retries?: SfnRetryProps[]
}

/**
 * Properties for configuring an SQS SendMessage step in a Step Functions workflow.
 * @see [CDK Step Functions Tasks Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks-readme.html}
 */
/** @category Interface */
export interface SfnSqsSendMessageProps extends SqsSendMessageProps {
  /** The name of the step */
  name: string
  /** Retry configuration for the step */
  retries?: SfnRetryProps[]
}

/**
 * Properties for configuring a Step Functions parallel state.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnParallelProps extends ParallelProps {
  /** The name of the step */
  name: string
  /** Retry configuration for the step */
  retries?: SfnRetryProps[]
}

/**
 * Properties for configuring a Step Functions choice state.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnChoiceProps extends ChoiceProps {
  /** The name of the step */
  name: string
}

/**
 * Properties for configuring a Step Functions wait state.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnWaitProps extends WaitProps {
  /** The name of the step */
  name: string
  /** Delay in seconds before proceeding to the next state */
  delayInSeconds: number
}

/**
 * Properties for configuring a Lambda invoke step in a Step Functions workflow.
 * @see [CDK Step Functions Tasks Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks-readme.html}
 */
/** @category Interface */
export interface SfnLambdaInvokeProps extends LambdaInvokeProps {
  /** The name of the step */
  name: string
  /** Retry configuration for the step */
  retries?: SfnRetryProps[]
}

/**
 * Properties for configuring an API Gateway REST API endpoint call step in a Step Functions workflow.
 * @see [CDK Step Functions Tasks Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks-readme.html}
 */
/** @category Interface */
export interface SfnCallApiGatewayRestApiEndpointProps extends CallApiGatewayRestApiEndpointProps {
  /** The name of the step */
  name: string
  /** Retry configuration for the step */
  retries?: SfnRetryProps[]
}

/**
 * Properties for configuring a Step Functions state machine.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnStateMachineProps extends StateMachineProps {}

/**
 * Properties for configuring a Step Functions map state.
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
/** @category Interface */
export interface SfnMapProps extends MapProps {}

/**
 * Properties for configuring a Step Functions start execution step.
 * @see [CDK Step Functions Tasks Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks-readme.html}
 */
/** @category Interface */
export interface SfnStartExecutionProps extends StepFunctionsStartExecutionProps {
  /** Retry configuration for the step */
  retries?: SfnRetryProps[]
}
