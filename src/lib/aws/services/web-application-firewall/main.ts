import { CfnIPSet, CfnWebACL } from 'aws-cdk-lib/aws-wafv2'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { WafIPSetProps, WafWebACLProps } from './types'

/**
 * @classdesc Provides operations on AWS WAF.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.wafManager.createWebAcl('MyWebAcl', this)
 *   }
 * }
 * @see [CDK WAF Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_waf-readme.html}
 */
export class WafManager {
  /**
   * @summary Method to create an ip set
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createIpSet(id: string, scope: CommonConstruct, props: WafIPSetProps) {
    if (!props) throw `WAF Ip Set props undefined for ${id}`
    if (!props.name) throw `WAF Ip Set name undefined for ${id}`

    const ipSet = new CfnIPSet(scope, `${id}`, {
      ...props,
      description: `IP Set for ${id} - ${scope.props.stage} stage`,
      name: scope.resourceNameFormatter.format(props.name, props.resourceNameOptions),
    })

    createCfnOutput(`${id}-ipSetId`, scope, ipSet.attrId)
    createCfnOutput(`${id}-ipSetArn`, scope, ipSet.attrArn)

    return ipSet
  }

  /**
   * @summary Method to create a web acl
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createWebAcl(id: string, scope: CommonConstruct, props: WafWebACLProps) {
    if (!props) throw `WAF WebACL props undefined for ${id}`
    if (!props.name) throw `WAF WebACL name undefined for ${id}`

    const webAcl = new CfnWebACL(scope, `${id}`, {
      ...props,
      description: `Web Acl for ${id} - ${scope.props.stage} stage`,
      name: scope.resourceNameFormatter.format(props.name, props.resourceNameOptions),
      tags: [{ key: 'service', value: scope.props.name }],
    })

    createCfnOutput(`${id}-webAclId`, scope, webAcl.attrId)
    createCfnOutput(`${id}-webAclArn`, scope, webAcl.attrArn)

    return webAcl
  }
}
