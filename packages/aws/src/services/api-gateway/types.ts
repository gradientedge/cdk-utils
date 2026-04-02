import { LambdaRestApiProps as LambdaRestApigProps, RestApiProps } from 'aws-cdk-lib/aws-apigateway'

import { TagProps } from '../../types/index.js'

/**
 */
/** @category Interface */
export interface LambdaRestApiProps extends LambdaRestApigProps {
  tags?: TagProps[]
  minCompressionSizeInBytes?: number
}

/** @category Interface */
export interface RestApigProps extends RestApiProps {}
