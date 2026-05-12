import { EventBridgeDestination } from 'aws-cdk-lib/aws-lambda-destinations'
import { AssetCode, IFunction, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'

import { LambdaEnvironment } from '../../services/index.js'

/**
 * Environment variables for the API destined Lambda function
 */
/** @category Interface */
export interface ApiDestinedLambdaEnvironment extends LambdaEnvironment {
  /** The source identifier for event tracing */
  SOURCE_ID: string
}

/**
 * Type definition for API destined Lambda resources used by the {@link ApiToEventBridgeTargetWithSns} construct
 */
/** @category Interface */
export interface ApiDestinedLambdaType {
  /** The EventBridge destination for failed Lambda invocations */
  destinationFailure: EventBridgeDestination
  /** The EventBridge destination for successful Lambda invocations */
  destinationSuccess: EventBridgeDestination
  /** The environment variables for the Lambda function */
  environment: ApiDestinedLambdaEnvironment
  /** The Lambda function */
  function: IFunction
  /** The Lambda layer source code asset */
  layerSource?: AssetCode
  /** The Lambda layers attached to the function */
  layers: LayerVersion[]
  /** The IAM policy for the Lambda function */
  policy: PolicyDocument
  /** The IAM role for the Lambda function */
  role: Role
  /** The Lambda function source code asset */
  source?: AssetCode
}
