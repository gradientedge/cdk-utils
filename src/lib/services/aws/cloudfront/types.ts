import { TagProps } from '../../../types'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import { CloudFrontWebDistributionProps, FunctionProps } from 'aws-cdk-lib/aws-cloudfront'

/**
 * @category cdk-utils.cloudfront-manager
 * @subcategory Properties
 */
export interface CloudFrontProps extends CloudFrontWebDistributionProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.cloudfront-manager
 * @subcategory Properties
 */
export interface DistributionProps extends cf.DistributionProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.cloudfront-manager
 * @subcategory Properties
 */
export interface CloudfrontFunctionProps extends FunctionProps {
  functionFilePath: string
  eventType: string
}
