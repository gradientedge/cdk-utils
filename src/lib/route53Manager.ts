import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as route53 from '@aws-cdk/aws-route53'
import * as route53Targets from '@aws-cdk/aws-route53-targets'
import { Route53Props } from './types'
import { CommonConstruct } from './commonConstruct'
import { createCfnOutput } from './genericUtils'

export class Route53Manager {
  public createHostedZone(id: string, scope: CommonConstruct) {
    let hostedZone: route53.IHostedZone

    if (!scope.props.routes || scope.props.routes.length == 0) throw `Route53 props undefined`

    const route53Props = scope.props.routes.find((r53: Route53Props) => r53.id === id)
    if (!route53Props) throw `Could not find route53 props for id:${id}`

    if (route53Props.existingHostedZone) {
      hostedZone = route53.HostedZone.fromLookup(scope, `${id}`, {
        domainName: scope.props.domainName,
      })
    } else {
      hostedZone = new route53.HostedZone(scope, `${id}`, {
        zoneName: scope.props.domainName,
        comment: `Hosted zone for ${scope.props.domainName}`,
      })
    }

    createCfnOutput(`${id}Id`, scope, hostedZone.hostedZoneId)
    createCfnOutput(`${id}Arn`, scope, hostedZone.hostedZoneArn)

    return hostedZone
  }

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

    createCfnOutput(`${id}DomainName`, scope, aRecord.domainName)

    return aRecord
  }
}