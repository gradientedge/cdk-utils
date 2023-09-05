import { LambdaRestApiProps as LambdaRestApigProps } from 'aws-cdk-lib/aws-apigateway'
import { TagProps } from '../../types'

/**
 */
export interface LambdaRestApiProps extends LambdaRestApigProps {
  tags?: TagProps[]
}
