import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

import { TagProps } from '../../types/index.js'

/**
 */
/** @category Interface */
export interface TableProps extends dynamodb.TableProps {
  tags?: TagProps[]
}

/** @category Interface */
export interface TablePropsV2 extends dynamodb.TablePropsV2 {
  tags?: TagProps[]
}
