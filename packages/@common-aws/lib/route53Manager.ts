import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as route53 from '@aws-cdk/aws-route53'
import * as route53Targets from '@aws-cdk/aws-route53-targets'
import { CommonStackProps } from './commonStack'
import { CommonConstruct } from './commonConstruct'
import { createCfnOutput } from './genericUtils'

export interface Route53Props extends route53.HostedZoneProps {
  id: string
  existingHostedZone?: boolean
}

export class Route53Manager {
  public createHostedZone(id: string, scope: CommonConstruct, props: CommonStackProps) {
    let hostedZone: route53.IHostedZone

    if (!props.routes || props.routes.length == 0) throw `Route53 props undefined`

    const route53Props = props.routes.find((r53: Route53Props) => r53.id === id)
    if (!route53Props) throw `Could not find route53 props for id:${id}`

    if (route53Props.existingHostedZone) {
      hostedZone = route53.HostedZone.fromLookup(scope, `${id}`, {
        domainName: props.domainName,
      })
    } else {
      hostedZone = new route53.HostedZone(scope, `${id}`, {
        zoneName: props.domainName,
        comment: `Hosted zone for ${props.domainName}`,
      })
    }

    createCfnOutput(`${id}Id`, scope, hostedZone.hostedZoneId)
    createCfnOutput(`${id}Arn`, scope, hostedZone.hostedZoneArn)

    return hostedZone
  }

  public createCloudFrontTargetARecord(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    distribution?: cloudfront.IDistribution,
    hostedZone?: route53.IHostedZone,
    recordName?: string
  ) {
    if (!distribution) throw `Distribution undefined`
    if (!hostedZone) throw `HostedZone undefined`

    const aRecord = new route53.ARecord(scope, `${id}`, {
      recordName:
        recordName && scope.isProductionStage() ? `${recordName}` : `${recordName}-${props.stage}`,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
      zone: hostedZone,
    })

    createCfnOutput(`${id}DomainName`, scope, aRecord.domainName)

    return aRecord
  }
}
