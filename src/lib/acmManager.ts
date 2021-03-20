import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cdk from '@aws-cdk/core'
import { CommonConstruct } from './commonConstruct'
import { AcmProps } from './types'
import { createCfnOutput } from './genericUtils'

/**
 * @classdesc Provides operations on AWS Certificates.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/common-aws/lib/commonConstruct'
 * import { CommonStackProps } from '@gradientedge/common-aws/lib/types'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.acmManager.createCertificate('MyCertificate', this)
 * }
 *
 * @see [Certificate Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-certificatemanager-readme.html}</li></i>
 */
export class AcmManager {
  /**
   * @summary Method to create/import a certificate
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @returns {acm.ICertificate}
   */
  public createCertificate(id: string, scope: CommonConstruct): acm.ICertificate {
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
