import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as cdk from 'aws-cdk-lib'
import { CommonConstruct } from '../common/commonConstruct'
import { AcmProps } from '../types'
import { createCfnOutput } from '../utils'

/**
 * @stability stable
 * @category Security, Identity & Compliance
 * @summary Provides operations on AWS Certificates.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.acmManager.createCertificate('MyCertificate', this)
 * }
 *
 * @see [CDK Certificate Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-certificatemanager-readme.html}
 */
export class AcmManager {
  /**
   * @summary Method to create/import a certificate
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {AcmProps} props certificate props
   * @param {route53.HostedZone?} hostedZone optional hosted zone to perform DNS validation
   * @returns {acm.ICertificate}
   *
   * @mermaid
   *   graph LR;
   *     A((Start)) --> B{Valid Properties?};
   *     B -- Yes --> C(Fetch By ARN);
   *     B -- No --> D[Throw Error];
   *     D --> G((Stop));
   *     C --> E{Valid ARN?};
   *     E -- Yes --> F(Return Certificate);
   *     E -- No --> D;
   *     F --> G;
   */
  public resolveCertificate(
    id: string,
    scope: CommonConstruct,
    props: AcmProps,
    hostedZone?: route53.HostedZone
  ): acm.ICertificate {
    if (!props) throw `Certificate props undefined`

    let certificate

    if (props.useExistingCertificate) {
      const certificateAccount = props.certificateAccount ? props.certificateAccount : cdk.Stack.of(scope).account
      const certificateRegion = props.certificateRegion ? props.certificateRegion : cdk.Stack.of(scope).region
      const certificateArn = `arn:aws:acm:${certificateRegion}:${certificateAccount}:certificate/${props.certificateId}`
      certificate = acm.Certificate.fromCertificateArn(scope, `${id}`, certificateArn)
    } else {
      certificate = new acm.Certificate(scope, `${id}`, {
        domainName: '',
        subjectAlternativeNames: [],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      })
    }

    createCfnOutput(`${id}-certificateArn`, scope, certificate.certificateArn)

    return certificate
  }
}
