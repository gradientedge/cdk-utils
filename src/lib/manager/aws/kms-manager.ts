import * as kms from 'aws-cdk-lib/aws-kms'
import * as common from '../../common'
import * as types from '../../types/aws'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.kms-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS KMS.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.kms.createKey('MyKey', this)
 *   }
 * }
 *
 * @see [CDK KMS Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_kms-readme.html}
 */
export class KmsManager {
  /**
   * @summary Method to create a KMS key
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.AcmProps} props KMS key props
   */
  public createKey(id: string, scope: common.CommonConstruct, props: types.KmsKeyProps) {
    if (!props) throw `KMS Key props undefined`

    const key = new kms.Key(scope, `${id}`, {
      description: props.description,
      alias: props.alias,
      enableKeyRotation: props.enableKeyRotation,
      enabled: props.enabled,
      keySpec: props.keySpec,
      keyUsage: props.keyUsage,
      policy: props.policy,
      admins: props.admins,
      removalPolicy: props.removalPolicy,
      pendingWindow: props.pendingWindow,
    })

    utils.createCfnOutput(`${id}-keyId`, scope, key.keyId)
    utils.createCfnOutput(`${id}-keyArn`, scope, key.keyArn)

    return key
  }
}
