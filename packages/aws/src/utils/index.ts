import { fromEnv, fromIni } from '@aws-sdk/credential-providers'
import { AwsCredentialIdentityProvider } from '@aws-sdk/types'
import { CfnOutput } from 'aws-cdk-lib'
import _ from 'lodash'

import { CommonConstruct } from '../common/index.js'

/**
 * @summary Helper method to add CloudFormation outputs from the construct
 * @param id scoped id of the resource
 * @param scope scope in which this resource is defined
 * @param value the value of the exported output
 * @param description optional description for the output
 * @param overrideId Flag which indicates whether to override the default logical id of the output
 * @returns The CloudFormation output
 */
/** @category Constant */
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
 * @summary Determine the AWS credentials provider based on the environment
 * Uses profile-based credentials when AWS_PROFILE is set, otherwise falls back to environment variables
 * @returns The resolved AWS credential identity provider
 */
/** @category Constant */
export function determineCredentials(): AwsCredentialIdentityProvider {
  if (process.env.AWS_PROFILE) return fromIni()
  return fromEnv()
}

/**
 * Default API Gateway Lambda proxy response object with CORS headers enabled
 */
const defaultResponseObject = {
  body: '',
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
  isBase64Encoded: false,
  statusCode: 200,
}

/**
 * @summary Format an error into a Lambda proxy response with a 500 status code
 * @param error the error object to format and log
 * @returns A Lambda proxy response object with the error message and 500 status
 */
/** @category Constant */
export function redirectError(error: any) {
  console.error(error, error.message, error.stack)
  return Object.assign({}, defaultResponseObject, {
    body: JSON.stringify(Object.assign({}, { error: error.message, success: false })),
    statusCode: 500,
  })
}

/**
 * @summary Format a success message into a Lambda proxy response with a 200 status code
 * @param message the success message to include in the response body
 * @returns A Lambda proxy response object with the message and 200 status
 */
/** @category Constant */
export function redirectSuccess(message: any) {
  return Object.assign({}, defaultResponseObject, {
    body: JSON.stringify(Object.assign({}, { error: message, success: true })),
    statusCode: 200,
  })
}
