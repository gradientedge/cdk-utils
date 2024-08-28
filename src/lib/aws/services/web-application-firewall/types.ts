import { CfnIPSetProps, CfnWebACLProps } from 'aws-cdk-lib/aws-wafv2'
import { ResourceNameFormatterProps } from '../../common'

/**
 */
export interface WafIPSetProps extends CfnIPSetProps {
  resourceNameOptions?: ResourceNameFormatterProps
}

/**
 */
export interface WafWebACLProps extends CfnWebACLProps {
  resourceNameOptions?: ResourceNameFormatterProps
}
