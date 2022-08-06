import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations'
import * as types from '../../types/aws'

/**
 * @stability stable
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory member
 * @classdesc Provides a construct to contain lambda resources for ApiToEventBridgeTarget
 */
export class ApiDestinedLambda implements types.ApiDestinedLambdaType {
  destinationFailure: destinations.EventBridgeDestination
  destinationSuccess: destinations.EventBridgeDestination
  environment: types.ApiDestinedLambdaEnvironment
  function: lambda.Function
  layers: lambda.LayerVersion[]
  policy: iam.PolicyDocument
  role: iam.Role
}
