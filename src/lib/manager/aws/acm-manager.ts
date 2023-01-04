import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.acm-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Certificates.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.acmManager.createCertificate('MyCertificate', this)
 *   }
 * }
 *
 * @see [CDK Certificate Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_certificatemanager-readme.html}
 */
export class AcmManager {
  /**
   * @summary Method to create/import a certificate
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.AcmProps} props certificate props
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
    scope: common.CommonConstruct,
    props: types.AcmProps,
    hostedZone?: route53.IHostedZone
  ): acm.ICertificate {
    if (!props) throw `Certificate props undefined for ${id}`

    let certificate

    if (props.useExistingCertificate) {
      let certificateArn = props.certificateArn
      if (!certificateArn) {
        const certificateAccount = props.certificateAccount ? props.certificateAccount : cdk.Stack.of(scope).account
        const certificateRegion = props.certificateRegion ? props.certificateRegion : cdk.Stack.of(scope).region
        certificateArn = `arn:aws:acm:${certificateRegion}:${certificateAccount}:certificate/${props.certificateId}`
      }
      certificate = acm.Certificate.fromCertificateArn(scope, `${id}`, certificateArn)
    } else {
      certificate = new acm.Certificate(scope, `${id}`, {
        domainName: props.domainName,
        subjectAlternativeNames: props.subjectAlternativeNames,
        validation: acm.CertificateValidation.fromDns(hostedZone),
      })
    }

    utils.createCfnOutput(`${id}-certificateArn`, scope, certificate.certificateArn)

    return certificate
  }
}
