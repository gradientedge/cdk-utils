import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as cr from 'aws-cdk-lib/custom-resources'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.ssm-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Systems Manager.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import { common.CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.acmManager.writeStringToParameters('MyParameter', this, ...props)
 *   }
 * }
 *
 * @see [CDK Systems Manager Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm-readme.html}
 */
export class SsmManager {
  public static SECRETS_MODIFIED_TIMESTAMP_PARAM = 'secrets-last-modified-timestamp'
  /**
   * Method to write a string parameter to the parameters store
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {ssm.StringParameterProps} props parameter props
   */
  public writeStringToParameters(id: string, scope: common.CommonConstruct, props: ssm.StringParameterProps) {
    if (!props) throw `Parameter props undefined for ${id}`

    const parameter = new ssm.StringParameter(scope, `${id}`, {
      parameterName: `${props.parameterName}-${scope.props.stage}`,
      description: `${props.description} - ${scope.props.stage} stage`,
      stringValue: props.stringValue,
    })

    utils.createCfnOutput(`${id}-parameterArn`, scope, parameter.parameterArn)
    utils.createCfnOutput(`${id}-parameterName`, scope, parameter.parameterName)

    return parameter
  }

  /**
   * Method to read a string parameter from the parameters store
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {string} parameterName parameter name to lookup
   */
  public readStringParameter(id: string, scope: common.CommonConstruct, parameterName: string) {
    if (!parameterName || parameterName == '') throw 'Invalid parameter name'

    return ssm.StringParameter.fromStringParameterName(scope, `${id}`, parameterName).stringValue
  }

  /**
   * Method to read a string parameter from the parameters store in a given region
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {string} parameterName parameter name to lookup
   * @param {string} region region name to lookup parameter
   */
  public readStringParameterFromRegion(
    id: string,
    scope: common.CommonConstruct,
    parameterName: string,
    region: string
  ) {
    if (!parameterName || parameterName == '') throw `Invalid parameter name for ${id}`
    if (!region || region == '') throw `Invalid region for ${id}`

    return new SSMParameterReader(scope, `${id}`, {
      parameterName: parameterName,
      region: region,
    }).getParameterValue()
  }
}

/**
 * @category cdk-utils.ssm-manager
 * @subcategory Construct
 * @classdesc Provides utilities to read same/cross region SSM parameters
 */
export class SSMParameterReader extends cr.AwsCustomResource {
  constructor(scope: common.CommonConstruct, name: string, props: types.SSMParameterReaderProps) {
    const { parameterName, region } = props

    const ssmAwsSdkCall: cr.AwsSdkCall = {
      service: 'SSM',
      action: 'getParameter',
      parameters: {
        Name: `${parameterName}-${scope.props.stage}`,
      },
      region,
      physicalResourceId: cr.PhysicalResourceId.of(name),
    }

    super(scope, name, {
      onUpdate: ssmAwsSdkCall,
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE }),
    })
  }

  /**
   *
   */
  public getParameterValue(): string {
    return this.getResponseField('Parameter.Value')
  }
}
