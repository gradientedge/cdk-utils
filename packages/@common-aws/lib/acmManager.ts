import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cdk from '@aws-cdk/core'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface AcmProps extends acm.CertificateProps {
  key: string
  certificateAccount?: string
  certificateRegion?: string
  certificateId: string
}

export class AcmManager {
  public createCertificate(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps
  ) {
    if (!props.certificates || props.certificates.length == 0) throw `Certificate props undefined`

    const certificateProps = props.certificates.find((cert: AcmProps) => cert.key === key)
    if (!certificateProps) throw `Could not find certificate props for key:${key}`

    const certificateAccount = certificateProps.certificateAccount
      ? certificateProps.certificateAccount
      : cdk.Stack.of(scope).account
    const certificateRegion = certificateProps.certificateRegion
      ? certificateProps.certificateRegion
      : cdk.Stack.of(scope).region
    const certificateArn = `arn:aws:acm:${certificateRegion}:${certificateAccount}:certificate/${certificateProps.certificateId}`
    const certificate = acm.Certificate.fromCertificateArn(scope, `${id}`, certificateArn)

    createCfnOutput(`${id}Arn`, scope, certificate.certificateArn)

    return certificate
  }
}
