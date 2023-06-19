import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations'
import { ApiDestinedLambdaEnvironment, ApiDestinedLambdaType } from './types'

/**
 * @classdesc Provides a construct to contain lambda resources for ApiToEventBridgeTargetWithSns
 */
export class ApiDestinedLambda implements ApiDestinedLambdaType {
  destinationFailure: destinations.EventBridgeDestination
  destinationSuccess: destinations.EventBridgeDestination
  environment: ApiDestinedLambdaEnvironment
  function: lambda.Function
  layers: lambda.LayerVersion[]
  policy: iam.PolicyDocument
  role: iam.Role
}
