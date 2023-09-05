import { Key } from 'aws-cdk-lib/aws-kms'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { KmsKeyProps } from './types'

/**
 * @classdesc Provides operations on AWS KMS.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
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
 * @see [CDK KMS Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_kms-readme.html}
 */
export class KmsManager {
  /**
   * @summary Method to create a KMS key
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props KMS key props
   */
  public createKey(id: string, scope: CommonConstruct, props: KmsKeyProps) {
    if (!props) throw `KMS Key props undefined for ${id}`

    const key = new Key(scope, `${id}`, {
      admins: props.admins,
      alias: `${props.alias}-${scope.props.stage}`,
      description: props.description,
      enableKeyRotation: props.enableKeyRotation,
      enabled: props.enabled,
      keySpec: props.keySpec,
      keyUsage: props.keyUsage,
      pendingWindow: props.pendingWindow,
      policy: props.policy,
      removalPolicy: props.removalPolicy,
    })

    createCfnOutput(`${id}-keyId`, scope, key.keyId)
    createCfnOutput(`${id}-keyArn`, scope, key.keyArn)

    return key
  }
}
