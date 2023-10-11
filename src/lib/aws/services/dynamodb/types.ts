import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { TagProps } from '../../types'

/**
 */
export interface TableProps extends dynamodb.TableProps {
  tags?: TagProps[]
}

export interface TablePropsV2 extends dynamodb.TablePropsV2 {
  tags?: TagProps[]
}
