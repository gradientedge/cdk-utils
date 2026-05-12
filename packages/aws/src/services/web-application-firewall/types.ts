import { CfnIPSetProps, CfnWebACLProps } from 'aws-cdk-lib/aws-wafv2'

/**
 * Properties for configuring a WAF IP set.
 * @see [CDK WAFv2 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_wafv2-readme.html}
 */
/** @category Interface */
export interface WafIPSetProps extends CfnIPSetProps {}

/**
 * Properties for configuring a WAF Web ACL.
 * @see [CDK WAFv2 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_wafv2-readme.html}
 */
/** @category Interface */
export interface WafWebACLProps extends CfnWebACLProps {}
