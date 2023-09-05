import { fromEnv, fromIni } from '@aws-sdk/credential-providers'
import { AwsCredentialIdentityProvider } from '@aws-sdk/types'
import { CfnOutput } from 'aws-cdk-lib'
import _ from 'lodash'
import { CommonConstruct } from '../../common'

/**
 * @summary Helper method to add CloudFormation outputs from the construct
 * @param id scoped id of the resource
 * @param scope scope in which this resource is defined
 * @param value the value of the exported output
 * @param description optional description for the output
 * @param overrideId Flag which indicates whether to override the default logical id of the output
 * @returns The CloudFormation output
 */
export function createCfnOutput(
  id: string,
  scope: CommonConstruct,
  value?: string,
  description?: string,
  overrideId = true
): CfnOutput {
  const camelName = _.camelCase(id)
  const output = new CfnOutput(scope, id, {
    description,
    exportName: `${scope.props.stackName}-${camelName}`,
    value: value ?? '',
  })
  if (overrideId) {
    output.overrideLogicalId(camelName)
  }
  return output
}

/**
 *
 */
export function determineCredentials(): AwsCredentialIdentityProvider {
  if (process.env.AWS_PROFILE) return fromIni()
  return fromEnv()
}
