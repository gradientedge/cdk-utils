import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'
import { IFunction, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { EventBridgeDestination } from 'aws-cdk-lib/aws-lambda-destinations'

import { ApiDestinedLambdaEnvironment, ApiDestinedLambdaType } from './types.js'

/**
 * Provides a construct to contain lambda resources for ApiToEventBridgeTargetWithSns
 * @category Construct
 */
export class ApiDestinedLambda implements ApiDestinedLambdaType {
  /** The EventBridge destination for failed Lambda invocations */
  destinationFailure: EventBridgeDestination
  /** The EventBridge destination for successful Lambda invocations */
  destinationSuccess: EventBridgeDestination
  /** The environment variables for the Lambda function */
  environment: ApiDestinedLambdaEnvironment
  /** The Lambda function */
  function: IFunction
  /** The Lambda layers attached to the function */
  layers: LayerVersion[]
  /** The IAM policy for the Lambda function */
  policy: PolicyDocument
  /** The IAM role for the Lambda function */
  role: Role
}
