import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { TagProps } from '../../../types'

/**
 * @category cdk-utils.dynamodb-manager
 * @subcategory Properties
 */
export interface TableProps extends dynamodb.TableProps {
  tags?: TagProps[]
}
