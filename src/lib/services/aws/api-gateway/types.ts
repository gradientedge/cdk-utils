import { TagProps } from '../../../types'
import * as apig from 'aws-cdk-lib/aws-apigateway'

/**
 */
export interface LambdaRestApiProps extends apig.LambdaRestApiProps {
  tags?: TagProps[]
}
