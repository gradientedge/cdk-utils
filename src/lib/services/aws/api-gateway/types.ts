import { TagProps } from '../../../types'
import * as apig from 'aws-cdk-lib/aws-apigateway'

/**
 * @category cdk-utils.api-manager
 * @subcategory Properties
 */
export interface LambdaRestApiProps extends apig.LambdaRestApiProps {
  tags?: TagProps[]
}
