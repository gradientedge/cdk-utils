import { LambdaEnvironment } from '../../services'
import { EventBridgeDestination } from 'aws-cdk-lib/aws-lambda-destinations'
import { AssetCode, IFunction, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Types
 */
export interface ApiDestinedLambdaEnvironment extends LambdaEnvironment {
  SOURCE_ID: string
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Types
 */
export interface ApiDestinedLambdaType {
  destinationFailure: EventBridgeDestination
  destinationSuccess: EventBridgeDestination
  environment: ApiDestinedLambdaEnvironment
  function: IFunction
  layers: LayerVersion[]
  layerSource?: AssetCode
  policy: PolicyDocument
  role: Role
  source?: AssetCode
}
