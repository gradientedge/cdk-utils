import { LambdaRestApiProps as LambdaRestApigProps, RestApiProps } from 'aws-cdk-lib/aws-apigateway'
import { ResourceNameFormatterProps } from '../../common'
import { TagProps } from '../../types'

/**
 */
export interface LambdaRestApiProps extends LambdaRestApigProps {
  tags?: TagProps[]
  minCompressionSizeInBytes?: number
}

export interface RestApigProps extends RestApiProps {}
