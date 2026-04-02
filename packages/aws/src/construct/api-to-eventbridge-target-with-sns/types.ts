import { EventBridgeDestination } from 'aws-cdk-lib/aws-lambda-destinations'
import { AssetCode, IFunction, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'

import { LambdaEnvironment } from '../../services/index.js'

/**
 */
/** @category Interface */
export interface ApiDestinedLambdaEnvironment extends LambdaEnvironment {
  SOURCE_ID: string
}

/**
 */
/** @category Interface */
export interface ApiDestinedLambdaType {
  destinationFailure: EventBridgeDestination
  destinationSuccess: EventBridgeDestination
  environment: ApiDestinedLambdaEnvironment
  function: IFunction
  layerSource?: AssetCode
  layers: LayerVersion[]
  policy: PolicyDocument
  role: Role
  source?: AssetCode
}
