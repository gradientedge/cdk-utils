import { LambdaRestApiProps as LambdaRestApigProps, RestApiProps } from 'aws-cdk-lib/aws-apigateway'

import { TagProps } from '../../types/index.js'

/**
 * Props for creating a Lambda-backed REST API with additional configuration options.
 * @see {@link ApiManager.createLambdaRestApi}
 */
/** @category Interface */
export interface LambdaRestApiProps extends LambdaRestApigProps {
  /** Optional tags to apply to the REST API resource */
  tags?: TagProps[]
  /** Minimum response payload size (in bytes) to be compressed */
  minCompressionSizeInBytes?: number
}

/**
 * Props for creating a REST API.
 */
/** @category Interface */
export interface RestApigProps extends RestApiProps {}
