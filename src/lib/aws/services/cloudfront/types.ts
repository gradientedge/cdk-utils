import { DistributionProps as CfDistributionProps, FunctionProps } from 'aws-cdk-lib/aws-cloudfront'
import { TagProps } from '../../types/index.js'

/**
 */
export interface DistributionProps extends CfDistributionProps {
  tags?: TagProps[]
}

/**
 */
export interface CloudfrontFunctionProps extends FunctionProps {
  eventType: string
  functionFilePath: string
}
