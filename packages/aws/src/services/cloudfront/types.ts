import { DistributionProps as CfDistributionProps, FunctionProps } from 'aws-cdk-lib/aws-cloudfront'

import { TagProps } from '../../types/index.js'

/**
 */
/** @category Interface */
export interface DistributionProps extends CfDistributionProps {
  tags?: TagProps[]
}

/**
 */
/** @category Interface */
export interface CloudfrontFunctionProps extends FunctionProps {
  eventType: string
  functionFilePath: string
}
