import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

import { TagProps } from '../../types/index.js'

/**
 * Props for creating a DynamoDB table (v1) with optional tags.
 * @see {@link DynamodbManager.createTable}
 */
/** @category Interface */
export interface TableProps extends dynamodb.TableProps {
  /** Optional tags to apply to the table */
  tags?: TagProps[]
}

/**
 * Props for creating a DynamoDB table (v2) with optional tags.
 * @see {@link DynamodbManager.createTableV2}
 */
/** @category Interface */
export interface TablePropsV2 extends dynamodb.TablePropsV2 {
  /** Optional tags to apply to the table */
  tags?: TagProps[]
}
