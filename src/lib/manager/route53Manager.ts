import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets'
import { Route53Props } from '../types'
import { CommonConstruct } from '../common/commonConstruct'
import { createCfnOutput } from '../utils'

/**
 * @category Networking & Content Delivery
 * @summary Provides operations on AWS Route53.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.route53Manager.createHostedZone('MyHostedZone', this)
 * }
 *
 * @see [CDK Route53 Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-route53-readme.html}</li></i>
 */
export class Route53Manager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {Route53Props} props
   */
  public createHostedZone(id: string, scope: CommonConstruct, props: Route53Props) {
    let hostedZone: route53.IHostedZone

    if (!props) throw `Route53 props undefined`

    if (props.existingHostedZone) {
      hostedZone = route53.HostedZone.fromLookup(scope, `${id}`, {
        domainName: scope.props.domainName,
      })
    } else {
      hostedZone = new route53.HostedZone(scope, `${id}`, {
        zoneName: scope.props.domainName,
        comment: `Hosted zone for ${scope.props.domainName}`,
      })
    }

    createCfnOutput(`${id}-hostedZoneId`, scope, hostedZone.hostedZoneId)
    createCfnOutput(`${id}-hostedZoneArn`, scope, hostedZone.hostedZoneArn)

    return hostedZone
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {cloudfront.IDistribution} distribution
   * @param {route53.IHostedZone} hostedZone
   * @param {string} recordName
   */
  public createCloudFrontTargetARecord(
    id: string,
    scope: CommonConstruct,
    distribution?: cloudfront.IDistribution,
    hostedZone?: route53.IHostedZone,
    recordName?: string
  ) {
    if (!distribution) throw `Distribution undefined`
    if (!hostedZone) throw `HostedZone undefined`

    const aRecord = new route53.ARecord(scope, `${id}`, {
      recordName:
        recordName && scope.isProductionStage()
          ? `${recordName}`
          : `${recordName}-${scope.props.stage}`,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
      zone: hostedZone,
    })

    createCfnOutput(`${id}-aRecordDomainName`, scope, aRecord.domainName)

    return aRecord
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {cloudfront.IDistribution} distribution
   * @param {route53.IHostedZone} hostedZone
   * @param {string} recordName
   */
  public createCloudFrontTargetARecordV2(
    id: string,
    scope: CommonConstruct,
    distribution?: cloudfront.IDistribution,
    hostedZone?: route53.IHostedZone,
    recordName?: string
  ) {
    if (!distribution) throw `Distribution undefined`
    if (!hostedZone) throw `HostedZone undefined`

    const aRecord = new route53.ARecord(scope, `${id}`, {
      recordName: recordName,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
      zone: hostedZone,
    })

    createCfnOutput(`${id}-aRecordDomainName`, scope, aRecord.domainName)

    return aRecord
  }

  /**
   *
   * @param id
   * @param scope
   * @param recordName
   * @param apiDomain
   * @param hostedZone
   */
  public createApiGatewayARecord(
    id: string,
    scope: CommonConstruct,
    recordName: string,
    apiDomain: apig.DomainName,
    hostedZone: route53.IHostedZone
  ) {
    const apiARecord = new route53.ARecord(scope, `${id}`, {
      recordName: recordName,
      target: route53.RecordTarget.fromAlias(new route53Targets.ApiGatewayDomain(apiDomain)),
      zone: hostedZone,
    })

    createCfnOutput(`${id}-a-record-domain-name`, scope, apiARecord.domainName)

    return apiARecord
  }
}
