import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { TagProps } from '../../types'

/**
 */
export interface TableProps extends dynamodb.TableProps {
  tags?: TagProps[]
}
