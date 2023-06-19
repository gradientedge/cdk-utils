import { TagProps } from '../../../types'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import { CloudFrontWebDistributionProps, FunctionProps } from 'aws-cdk-lib/aws-cloudfront'

/**
 */
export interface CloudFrontProps extends CloudFrontWebDistributionProps {
  tags?: TagProps[]
}

/**
 */
export interface DistributionProps extends cf.DistributionProps {
  tags?: TagProps[]
}

/**
 */
export interface CloudfrontFunctionProps extends FunctionProps {
  eventType: string
  functionFilePath: string
}
