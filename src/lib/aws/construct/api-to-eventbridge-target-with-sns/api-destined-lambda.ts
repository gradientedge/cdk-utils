import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'
import { IFunction, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { EventBridgeDestination } from 'aws-cdk-lib/aws-lambda-destinations'
import { ApiDestinedLambdaEnvironment, ApiDestinedLambdaType } from './types.js'

/**
 * @classdesc Provides a construct to contain lambda resources for ApiToEventBridgeTargetWithSns
 */
export class ApiDestinedLambda implements ApiDestinedLambdaType {
  destinationFailure: EventBridgeDestination
  destinationSuccess: EventBridgeDestination
  environment: ApiDestinedLambdaEnvironment
  function: IFunction
  layers: LayerVersion[]
  policy: PolicyDocument
  role: Role
}
