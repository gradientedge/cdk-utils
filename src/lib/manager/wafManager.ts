import * as wafv2 from 'aws-cdk-lib/aws-wafv2'
import { CommonConstruct } from '../common/commonConstruct'
import { createCfnOutput } from '../utils'
import { WafIPSetProps, WafWebACLProps } from '../types'

/**
 * @category Security, Identity & Compliance
 * @summary Provides operations on AWS WAF.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.wafManager.createWebAcl('MyWebAcl', this)
 * }
 *
 * @see [CDK WAF Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-waf-readme.html}</li></i>
 */
export class WafManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {WafIPSetProps} props
   */
  public createIpSet(id: string, scope: CommonConstruct, props: WafIPSetProps) {
    if (!props) throw `WAF Ip Set props undefined`

    const ipSet = new wafv2.CfnIPSet(scope, `${id}`, {
      name: scope.isProductionStage() ? props.name : `${props.name}-${scope.props.stage}`,
      description: `IP Set for ${id} - ${scope.props.stage} stage`,
      addresses: props.addresses,
      ipAddressVersion: props.ipAddressVersion,
      scope: props.scope,
    })

    createCfnOutput(`${id}-ipSetId`, scope, ipSet.attrId)
    createCfnOutput(`${id}-ipSetArn`, scope, ipSet.attrArn)

    return ipSet
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {WafWebACLProps} props
   */
  public createWebAcl(id: string, scope: CommonConstruct, props: WafWebACLProps) {
    if (!props) throw `WAF WebACL props undefined`

    const webAcl = new wafv2.CfnWebACL(scope, `${id}`, {
      name: scope.isProductionStage() ? props.name : `${props.name}-${scope.props.stage}`,
      description: `Web Acl for ${id} - ${scope.props.stage} stage`,
      defaultAction: props.defaultAction,
      scope: props.scope,
      visibilityConfig: props.visibilityConfig,
      rules: props.rules,
      tags: [{ key: 'service', value: scope.props.name }],
    })

    createCfnOutput(`${id}-webAclId`, scope, webAcl.attrId)
    createCfnOutput(`${id}-webAclArn`, scope, webAcl.attrArn)

    return webAcl
  }
}
