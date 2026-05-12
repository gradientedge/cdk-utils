import { DistributionProps as CfDistributionProps, FunctionProps } from 'aws-cdk-lib/aws-cloudfront'

import { TagProps } from '../../types/index.js'

/**
 * Props for creating a CloudFront distribution with optional tags.
 * @see {@link CloudFrontManager.createDistributionWithS3Origin}
 * @see {@link CloudFrontManager.createDistributionWithHttpOrigin}
 */
/** @category Interface */
export interface DistributionProps extends CfDistributionProps {
  /** Optional tags to apply to the distribution */
  tags?: TagProps[]
}

/**
 * Props for creating a CloudFront function.
 * @see {@link CloudFrontManager.createCloudfrontFunction}
 */
/** @category Interface */
export interface CloudfrontFunctionProps extends FunctionProps {
  /** The CloudFront event type that triggers the function (e.g. viewer-request, viewer-response) */
  eventType: string
  /** The file path to the CloudFront function source code */
  functionFilePath: string
}
