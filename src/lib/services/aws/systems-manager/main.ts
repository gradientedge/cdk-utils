import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as cr from 'aws-cdk-lib/custom-resources'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'
import { SSMParameterReaderProps } from './types'

/**
 * @classdesc Provides operations on AWS Systems Manager.
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
 *   }
 * }
 * @see [CDK Systems Manager Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm-readme.html}
 */
export class SsmManager {
  public static SECRETS_MODIFIED_TIMESTAMP_PARAM = 'secrets-last-modified-timestamp'

  /**
   * Method to write a string parameter to the parameters store
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props parameter props
   */
  public writeStringToParameters(id: string, scope: CommonConstruct, props: ssm.StringParameterProps) {
    if (!props) throw `Parameter props undefined for ${id}`

    const parameter = new ssm.StringParameter(scope, `${id}`, {
      description: `${props.description} - ${scope.props.stage} stage`,
      parameterName: `${props.parameterName}-${scope.props.stage}`,
      stringValue: props.stringValue,
    })

    utils.createCfnOutput(`${id}-parameterArn`, scope, parameter.parameterArn)
    utils.createCfnOutput(`${id}-parameterName`, scope, parameter.parameterName)

    return parameter
  }

  /**
   * Method to read a string parameter from the parameters store
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param parameterName parameter name to lookup
   */
  public readStringParameter(id: string, scope: CommonConstruct, parameterName: string) {
    if (!parameterName || parameterName == '') throw 'Invalid parameter name'

    return ssm.StringParameter.valueFromLookup(scope, parameterName)
  }

  /**
   * Method to read a string parameter from the parameters store in a given region
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param parameterName parameter name to lookup
   * @param region region name to lookup parameter
   */
  public readStringParameterFromRegion(id: string, scope: CommonConstruct, parameterName: string, region: string) {
    if (!parameterName || parameterName == '') throw `Invalid parameter name for ${id}`
    if (!region || region == '') throw `Invalid region for ${id}`

    return new SSMParameterReader(scope, `${id}`, {
      parameterName: parameterName,
      region: region,
    }).getParameterValue()
  }
}

/**
 * @classdesc Provides utilities to read same/cross region SSM parameters
 */
export class SSMParameterReader extends cr.AwsCustomResource {
  constructor(scope: CommonConstruct, name: string, props: SSMParameterReaderProps) {
    const { parameterName, region } = props

    const ssmAwsSdkCall: cr.AwsSdkCall = {
      action: 'getParameter',
      parameters: {
        Name: `${parameterName}-${scope.props.stage}`,
      },
      physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
      region,
      service: 'SSM',
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
