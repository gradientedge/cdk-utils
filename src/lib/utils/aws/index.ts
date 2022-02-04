import * as cdk from 'aws-cdk-lib'
import * as _ from 'lodash'
import { CommonConstruct } from '../../common'

/**
 * @category Utils
 * @summary Helper method to add CloudFormation outputs from the construct
 * @param {string} id scoped id of the resource
 * @param {CommonConstruct} scope scope in which this resource is defined
 * @param {string} id scoped id of the resource
 * @param {string} value the value of the exported output
 * @param {string?} description optional description for the output
 * @param {boolean} overrideId Flag which indicates whether to override the default logical id of the output
 *
 * @return {cdk.CfnOutput} The CloudFormation output
 */
export function createCfnOutput(
  id: string,
  scope: CommonConstruct,
  value?: string,
  description?: string,
  overrideId = true
): cdk.CfnOutput {
  const camelName = _.camelCase(id)
  const output = new cdk.CfnOutput(scope, id, {
    exportName: `${scope.props.stackName}-${camelName}`,
    value: value ?? '',
    description,
  })
  if (overrideId) {
    output.overrideLogicalId(camelName)
  }
  return output
}
