import * as wafv2 from 'aws-cdk-lib/aws-wafv2'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'
import { WafIPSetProps, WafWebACLProps } from './types'

/**
 * @stability stable
 * @category cdk-utils.waf-manager
 * @subcategory Construct
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
 *
 * @see [CDK WAF Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_waf-readme.html}
 */
export class WafManager {
  /**
   * @summary Method to create an ip set
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {WafIPSetProps} props
   */
  public createIpSet(id: string, scope: CommonConstruct, props: WafIPSetProps) {
    if (!props) throw `WAF Ip Set props undefined for ${id}`

    const ipSet = new wafv2.CfnIPSet(scope, `${id}`, {
      name: scope.isProductionStage() ? props.name : `${props.name}-${scope.props.stage}`,
      description: `IP Set for ${id} - ${scope.props.stage} stage`,
      addresses: props.addresses,
      ipAddressVersion: props.ipAddressVersion,
      scope: props.scope,
    })

    utils.createCfnOutput(`${id}-ipSetId`, scope, ipSet.attrId)
    utils.createCfnOutput(`${id}-ipSetArn`, scope, ipSet.attrArn)

    return ipSet
  }

  /**
   * @summary Method to create a web acl
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {WafWebACLProps} props
   */
  public createWebAcl(id: string, scope: CommonConstruct, props: WafWebACLProps) {
    if (!props) throw `WAF WebACL props undefined for ${id}`

    const webAcl = new wafv2.CfnWebACL(scope, `${id}`, {
      name: scope.isProductionStage() ? props.name : `${props.name}-${scope.props.stage}`,
      description: `Web Acl for ${id} - ${scope.props.stage} stage`,
      defaultAction: props.defaultAction,
      scope: props.scope,
      visibilityConfig: props.visibilityConfig,
      rules: props.rules,
      tags: [{ key: 'service', value: scope.props.name }],
    })

    utils.createCfnOutput(`${id}-webAclId`, scope, webAcl.attrId)
    utils.createCfnOutput(`${id}-webAclArn`, scope, webAcl.attrArn)

    return webAcl
  }
}
