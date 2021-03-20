import * as cdk from '@aws-cdk/core'
import * as _ from 'lodash'
import { CommonConstruct } from './commonConstruct'

/**
 *
 */
const defaultResponseObject = {
  statusCode: 200,
  body: '',
  isBase64Encoded: false,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
}

/**
 *
 * @param stage
 */
export const isDevStage = (stage: string) => stage === 'dev'
/**
 *
 * @param stage
 */
export const isTestStage = (stage: string) => stage === 'tst'
/**
 *
 * @param stage
 */
export const isUatStage = (stage: string) => stage === 'uat'
/**
 *
 * @param stage
 */
export const isPrdStage = (stage: string) => stage === 'prd'

/**
 *
 * @param {string} id scoped id of the resource
 * @param {CommonConstruct} scope scope in which this resource is defined
 * @param value
 * @param description
 * @param overrideId
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
    value: value ? value : '',
    description,
  })
  if (overrideId) {
    output.overrideLogicalId(camelName)
  }
  return output
}

/**
 *
 * @param error
 */
export function redirectError(error: any) {
  console.error(error, error.message, error.stack)
  return Object.assign({}, defaultResponseObject, {
    statusCode: 500,
    body: JSON.stringify(Object.assign({}, { success: false, error: error.message })),
  })
}

/**
 *
 * @param message
 */
export function redirectSuccess(message: any) {
  return Object.assign({}, defaultResponseObject, {
    statusCode: 200,
    body: JSON.stringify(Object.assign({}, { success: true, error: message })),
  })
}
