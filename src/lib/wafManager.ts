import * as wafv2 from '@aws-cdk/aws-wafv2'
import { CommonConstruct } from './commonConstruct'
import { createCfnOutput } from './genericUtils'
import { WafIPSetProps, WafWebACLProps } from './types'

/**
 *
 */
export class WafManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createIpSet(id: string, scope: CommonConstruct) {
    if (!scope.props.wafIpSets || scope.props.wafIpSets.length == 0)
      throw `WAF Ip Set props undefined`

    const ipSetProps = scope.props.wafIpSets.find((props: WafIPSetProps) => props.id === id)
    if (!ipSetProps) throw `Could not find WAF Ip Set props for id:${id}`

    if (!ipSetProps.name) throw `Name undefined for id:${id}`

    const ipSet = new wafv2.CfnIPSet(scope, `${id}`, {
      name: scope.isProductionStage() ? ipSetProps.name : `${ipSetProps.name}-${scope.props.stage}`,
      description: `IP Set for ${id} - ${scope.props.stage} stage`,
      addresses: ipSetProps.addresses,
      ipAddressVersion: ipSetProps.ipAddressVersion,
      scope: ipSetProps.scope,
    })

    createCfnOutput(`${id}Id`, scope, ipSet.attrId)
    createCfnOutput(`${id}Arn`, scope, ipSet.attrArn)

    return ipSet
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createWebAcl(id: string, scope: CommonConstruct) {
    if (!scope.props.wafWebAcls || scope.props.wafWebAcls.length == 0)
      throw `WAF WebACL props undefined`

    const wafWebAclProps = scope.props.wafWebAcls.find((props: WafWebACLProps) => props.id === id)
    if (!wafWebAclProps) throw `Could not find WAF WebACL props for id:${id}`
    if (!wafWebAclProps.name) throw `Name undefined for id:${id}`

    const webAcl = new wafv2.CfnWebACL(scope, `${id}`, {
      name: scope.isProductionStage()
        ? wafWebAclProps.name
        : `${wafWebAclProps.name}-${scope.props.stage}`,
      description: `Web Acl for ${id} - ${scope.props.stage} stage`,
      defaultAction: wafWebAclProps.defaultAction,
      scope: wafWebAclProps.scope,
      visibilityConfig: wafWebAclProps.visibilityConfig,
      rules: wafWebAclProps.rules,
      tags: [{ key: 'service', value: scope.props.name }],
    })

    createCfnOutput(`${id}Id`, scope, webAcl.attrId)
    createCfnOutput(`${id}Arn`, scope, webAcl.attrArn)

    return webAcl
  }
}
