import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { ResourceNameFormatterProps } from '../../common'
import { TagProps } from '../../types'

/**
 */
export interface TableProps extends dynamodb.TableProps {
  resourceNameOptions?: ResourceNameFormatterProps
  tags?: TagProps[]
}

export interface TablePropsV2 extends dynamodb.TablePropsV2 {
  resourceNameOptions?: ResourceNameFormatterProps
  tags?: TagProps[]
}
