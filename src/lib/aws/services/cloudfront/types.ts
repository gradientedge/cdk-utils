import {
  DistributionProps as CfDistributionProps,
  CloudFrontWebDistributionProps,
  FunctionProps,
} from 'aws-cdk-lib/aws-cloudfront'
import { ResourceNameFormatterProps } from '../../common'
import { TagProps } from '../../types'

/**
 */
export interface CloudFrontProps extends CloudFrontWebDistributionProps {
  tags?: TagProps[]
}

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
  resourceNameOptions?: ResourceNameFormatterProps
}
