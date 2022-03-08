import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.route53-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Route53.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.route53Manager.createHostedZone('MyHostedZone', this)
 *   }
 * }
 *
 * @see [CDK Route53 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53-readme.html}
 */
export class Route53Manager {
  /**
   * @summary Method to create a hosted zone
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.Route53Props} props
   */
  public createHostedZone(id: string, scope: common.CommonConstruct, props: types.Route53Props) {
    let hostedZone: route53.IHostedZone

    if (!props) throw `Route53 props undefined`

    if (props.useExistingHostedZone) {
      hostedZone = route53.HostedZone.fromLookup(scope, `${id}`, {
        domainName: scope.props.domainName,
      })
    } else {
      hostedZone = new route53.HostedZone(scope, `${id}`, {
        zoneName: scope.props.domainName,
        comment: `Hosted zone for ${scope.props.domainName}`,
      })
    }

    utils.createCfnOutput(`${id}-hostedZoneId`, scope, hostedZone.hostedZoneId)
    utils.createCfnOutput(`${id}-hostedZoneArn`, scope, hostedZone.hostedZoneArn)

    return hostedZone
  }

  /**
   * @summary Method to create/lookup a hosted zone
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param useExistingHostedZone Flag to indicate whether to lookup vs create new hosted zone
   */
  public withHostedZoneFromFullyQualifiedDomainName(
    id: string,
    scope: common.CommonConstruct,
    useExistingHostedZone: boolean
  ) {
    let hostedZone: route53.IHostedZone

    if (useExistingHostedZone) {
      hostedZone = route53.HostedZone.fromLookup(scope, `${id}`, {
        domainName: scope.fullyQualifiedDomainName,
      })
    } else {
      hostedZone = new route53.HostedZone(scope, `${id}`, {
        zoneName: scope.fullyQualifiedDomainName,
        comment: `Hosted zone for ${scope.fullyQualifiedDomainName}`,
      })
    }

    utils.createCfnOutput(`${id}-hostedZoneId`, scope, hostedZone.hostedZoneId)
    utils.createCfnOutput(`${id}-hostedZoneArn`, scope, hostedZone.hostedZoneArn)

    return hostedZone
  }

  /**
   * @summary Method to create a-record for cloudfront target
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {cloudfront.IDistribution} distribution
   * @param {route53.IHostedZone} hostedZone
   * @param {string} recordName
   * @param skipStageFromRecord
   */
  public createCloudFrontTargetARecord(
    id: string,
    scope: common.CommonConstruct,
    distribution?: cloudfront.IDistribution,
    hostedZone?: route53.IHostedZone,
    recordName?: string,
    skipStageFromRecord?: boolean
  ) {
    if (!distribution) throw `Distribution undefined`
    if (!hostedZone) throw `HostedZone undefined`

    const aRecord = new route53.ARecord(scope, `${id}`, {
      recordName:
        (recordName && scope.isProductionStage()) || skipStageFromRecord
          ? `${recordName}`
          : `${recordName}-${scope.props.stage}`,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
      zone: hostedZone,
    })

    utils.createCfnOutput(`${id}-aRecordDomainName`, scope, aRecord.domainName)

    return aRecord
  }

  /**
   * @summary Method to create a-record for cloudfront target
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {cloudfront.IDistribution} distribution
   * @param {route53.IHostedZone} hostedZone
   * @param {string} recordName
   */
  public createCloudFrontTargetARecordV2(
    id: string,
    scope: common.CommonConstruct,
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

    utils.createCfnOutput(`${id}-aRecordDomainName`, scope, aRecord.domainName)

    return aRecord
  }

  /**
   * @summary Method to create a-record for restApi gateway target
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param recordName
   * @param apiDomain
   * @param hostedZone
   * @param skipStageFromRecord
   */
  public createApiGatewayARecord(
    id: string,
    scope: common.CommonConstruct,
    recordName: string,
    apiDomain: apig.DomainName,
    hostedZone: route53.IHostedZone,
    skipStageFromRecord?: boolean
  ) {
    let apiRecordName = ''
    if (recordName && recordName !== '')
      apiRecordName =
        scope.isProductionStage() || skipStageFromRecord ? `${recordName}` : `${recordName}-${scope.props.stage}`

    const apiARecord = new route53.ARecord(scope, `${id}`, {
      recordName: apiRecordName,
      target: route53.RecordTarget.fromAlias(new route53Targets.ApiGatewayDomain(apiDomain)),
      zone: hostedZone,
    })

    utils.createCfnOutput(`${id}-a-record-domain-name`, scope, apiARecord.domainName)

    return apiARecord
  }
}
