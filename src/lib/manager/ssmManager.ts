import { CommonConstruct } from '../common/commonConstruct'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { createCfnOutput } from '../utils'
import * as cr from 'aws-cdk-lib/custom-resources'
import { SSMParameterReaderProps } from '../types'

/**
 * @stability stable
 * @category Management & Governance
 * @summary Provides operations on AWS Systems Manager.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.acmManager.writeStringToParameters('MyParameter', this, ...props)
 * }
 *
 * @see [CDK Systems Manager Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-ssm-readme.html}
 */
export class SsmManager {
  /**
   * Method to write a string parameter to the parameters store
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {ssm.StringParameterProps} props parameter props
   */
  public writeStringToParameters(id: string, scope: CommonConstruct, props: ssm.StringParameterProps) {
    if (!props) throw `Parameter props undefined`

    const parameter = new ssm.StringParameter(scope, `${id}`, {
      parameterName: `${props.parameterName}-${scope.props.stage}`,
      description: `${props.description} - ${scope.props.stage} stage`,
      stringValue: props.stringValue,
    })

    createCfnOutput(`${id}-parameterArn`, scope, parameter.parameterArn)
    createCfnOutput(`${id}-parameterName`, scope, parameter.parameterName)

    return parameter
  }

  /**
   * Method to read a string parameter from the parameters store
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string} parameterName parameter name to lookup
   */
  public readStringParameter(id: string, scope: CommonConstruct, parameterName: string) {
    if (!parameterName || parameterName == '') throw 'Invalid parameter name'

    return ssm.StringParameter.fromStringParameterName(scope, `${id}`, parameterName).stringValue
  }

  /**
   * Method to read a string parameter from the parameters store in a given region
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string} parameterName parameter name to lookup
   * @param {string} region region name to lookup parameter
   */
  public readStringParameterFromRegion(id: string, scope: CommonConstruct, parameterName: string, region: string) {
    if (!parameterName || parameterName == '') throw 'Invalid parameter name'
    if (!region || region == '') throw 'Invalid region'

    return new SSMParameterReader(scope, `${id}`, {
      parameterName: parameterName,
      region: region,
    }).getParameterValue()
  }
}

/**
 *
 */
export class SSMParameterReader extends cr.AwsCustomResource {
  /**
   *
   * @param scope
   * @param name
   * @param props
   */
  constructor(scope: CommonConstruct, name: string, props: SSMParameterReaderProps) {
    const { parameterName, region } = props

    const ssmAwsSdkCall: cr.AwsSdkCall = {
      service: 'SSM',
      action: 'getParameter',
      parameters: {
        Name: `${parameterName}-${scope.props.stage}`,
      },
      region,
      physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
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
