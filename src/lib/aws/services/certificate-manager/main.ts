import { Stack } from 'aws-cdk-lib'
import { Certificate, CertificateValidation, ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { CommonConstruct } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'
import { AcmProps } from './types.js'

/**
 * @classdesc Provides operations on AWS Certificates.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.acmManager.createCertificate('MyCertificate', this)
 *   }
 * }
 * @see [CDK Certificate Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_certificatemanager-readme.html}
 */
export class AcmManager {
  /**
   * @summary Method to create/import a certificate
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props certificate props
   * @param hostedZone optional hosted zone to perform DNS validation
   * @returns the resolved certificate
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
    hostedZone?: IHostedZone
  ): ICertificate {
    if (!props) throw `Certificate props undefined for ${id}`

    let certificate

    if (props.useExistingCertificate) {
      let certificateArn = props.certificateArn
      if (!certificateArn) {
        const certificateAccount = props.certificateAccount ? props.certificateAccount : Stack.of(scope).account
        const certificateRegion = props.certificateRegion ? props.certificateRegion : Stack.of(scope).region
        certificateArn = `arn:aws:acm:${certificateRegion}:${certificateAccount}:certificate/${props.certificateId}`
      }
      certificate = Certificate.fromCertificateArn(scope, `${id}`, certificateArn)
    } else {
      certificate = new Certificate(scope, `${id}`, {
        domainName: props.domainName,
        subjectAlternativeNames: props.subjectAlternativeNames,
        validation: CertificateValidation.fromDns(hostedZone),
      })
    }

    createCfnOutput(`${id}-certificateArn`, scope, certificate.certificateArn)

    return certificate
  }
}
