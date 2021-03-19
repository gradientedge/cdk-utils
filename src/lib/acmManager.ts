import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cdk from '@aws-cdk/core'
import { CommonConstruct } from './commonConstruct'
import { AcmProps } from './types'
import { createCfnOutput } from './genericUtils'

export class AcmManager {
  public createCertificate(id: string, scope: CommonConstruct, test?: string) {
    if (!scope.props.certificates || scope.props.certificates.length == 0)
      throw `Certificate props undefined`

    const certificateProps = scope.props.certificates.find((cert: AcmProps) => cert.id === id)
    if (!certificateProps) throw `Could not find certificate props for id:${id}`

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
