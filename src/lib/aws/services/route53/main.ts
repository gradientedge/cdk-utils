import { DomainName } from 'aws-cdk-lib/aws-apigateway'
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront'
import { ARecord, HostedZone, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { ApiGatewayDomain, CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { Route53Props } from './types'

/**
 * @classdesc Provides operations on AWS Route53
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.route53Manager.createHostedZone('MyHostedZone', this)
 *   }
 * }
 * @see [CDK Route53 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53-readme.html}
 */
export class Route53Manager {
  /**
   * @summary Method to create a hosted zone
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createHostedZone(id: string, scope: CommonConstruct, props: Route53Props) {
    let hostedZone: IHostedZone

    if (!props) throw `Route53 props undefined for ${id}`

    if (props.useExistingHostedZone) {
      hostedZone = HostedZone.fromLookup(scope, `${id}`, {
        domainName: scope.props.domainName,
      })
    } else {
      hostedZone = new HostedZone(scope, `${id}`, {
        comment: `Hosted zone for ${scope.props.domainName}`,
        zoneName: scope.props.domainName,
      })
    }

    createCfnOutput(`${id}-hostedZoneId`, scope, hostedZone.hostedZoneId)
    createCfnOutput(`${id}-hostedZoneArn`, scope, hostedZone.hostedZoneArn)

    return hostedZone
  }

  /**
   * @summary Method to create/lookup a hosted zone
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param useExistingHostedZone Flag to indicate whether to lookup vs create new hosted zone
   */
  public withHostedZoneFromFullyQualifiedDomainName(
    id: string,
    scope: CommonConstruct,
    useExistingHostedZone: boolean
  ) {
    let hostedZone: IHostedZone

    if (useExistingHostedZone) {
      hostedZone = HostedZone.fromLookup(scope, `${id}`, {
        domainName: scope.fullyQualifiedDomainName,
      })
    } else {
      hostedZone = new HostedZone(scope, `${id}`, {
        comment: `Hosted zone for ${scope.fullyQualifiedDomainName}`,
        zoneName: scope.fullyQualifiedDomainName,
      })
    }

    createCfnOutput(`${id}-hostedZoneId`, scope, hostedZone.hostedZoneId)
    createCfnOutput(`${id}-hostedZoneArn`, scope, hostedZone.hostedZoneArn)

    return hostedZone
  }

  /**
   * @summary Method to create a-record for cloudfront target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param distribution
   * @param hostedZone
   * @param recordName
   * @param skipStageFromRecord
   */
  public createCloudFrontTargetARecord(
    id: string,
    scope: CommonConstruct,
    distribution?: IDistribution,
    hostedZone?: IHostedZone,
    recordName?: string,
    skipStageFromRecord?: boolean
  ) {
    if (!distribution) throw `Distribution undefined for ${id}`
    if (!hostedZone) throw `HostedZone undefined for ${id}`

    const aRecord = new ARecord(scope, `${id}`, {
      recordName:
        (recordName && scope.isProductionStage()) || skipStageFromRecord
          ? `${recordName}`
          : `${recordName}-${scope.props.stage}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone,
    })

    createCfnOutput(`${id}-aRecordDomainName`, scope, aRecord.domainName)

    return aRecord
  }

  /**
   * @summary Method to create a-record for cloudfront target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param distribution
   * @param hostedZone
   * @param recordName
   */
  public createCloudFrontTargetARecordV2(
    id: string,
    scope: CommonConstruct,
    distribution?: IDistribution,
    hostedZone?: IHostedZone,
    recordName?: string
  ) {
    if (!distribution) throw `Distribution undefined for ${id}`
    if (!hostedZone) throw `HostedZone undefined for ${id}`

    const aRecord = new ARecord(scope, `${id}`, {
      recordName: recordName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone,
    })

    createCfnOutput(`${id}-aRecordDomainName`, scope, aRecord.domainName)

    return aRecord
  }

  /**
   * @summary Method to create a-record for restApi gateway target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param recordName
   * @param apiDomain
   * @param hostedZone
   * @param skipStageFromRecord
   */
  public createApiGatewayARecord(
    id: string,
    scope: CommonConstruct,
    recordName: string,
    apiDomain: DomainName,
    hostedZone: IHostedZone,
    skipStageFromRecord?: boolean
  ) {
    let apiRecordName = ''
    if (recordName && recordName !== '')
      apiRecordName =
        scope.isProductionStage() || skipStageFromRecord ? `${recordName}` : `${recordName}-${scope.props.stage}`

    const apiARecord = new ARecord(scope, `${id}`, {
      recordName: apiRecordName,
      target: RecordTarget.fromAlias(new ApiGatewayDomain(apiDomain)),
      zone: hostedZone,
    })

    createCfnOutput(`${id}-a-record-domain-name`, scope, apiARecord.domainName)

    return apiARecord
  }
}
