import { LambdaRestApiProps as LambdaRestApigProps, RestApiProps } from 'aws-cdk-lib/aws-apigateway'
import { ResourceNameFormatterProps } from '../../common/index.js'
import { TagProps } from '../../types/index.js'

/**
 */
export interface LambdaRestApiProps extends LambdaRestApigProps {
  tags?: TagProps[]
  minCompressionSizeInBytes?: number
}

export interface RestApigProps extends RestApiProps {}
