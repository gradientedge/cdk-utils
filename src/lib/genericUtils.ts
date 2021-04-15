import * as cdk from '@aws-cdk/core'
import * as _ from 'lodash'
import { CommonConstruct } from './commonConstruct'

/**
 * @category Utils
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
 * LogLevel enumeration
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  TRACE = 'TRACE',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * @category Utils
 */
export enum CloudWatchWidgetType {
  Text = 'Text',
  SingleValue = 'SingleValue',
  Graph = 'Graph',
  AlarmStatus = 'AlarmStatus',
  LogQuery = 'LogQuery',
}

/**
 * @category Utils
 * @param stage
 */
export const isDevStage = (stage: string) => stage === 'dev'
/**
 * @category Utils
 * @param stage
 */
export const isTestStage = (stage: string) => stage === 'tst'
/**
 * @category Utils
 * @param stage
 */
export const isUatStage = (stage: string) => stage === 'uat'
/**
 * @category Utils
 * @param stage
 */
export const isPrdStage = (stage: string) => stage === 'prd'

/**
 * @category Utils
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
 * @category Utils
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
 * @category Utils
 * @param message
 */
export function redirectSuccess(message: any) {
  return Object.assign({}, defaultResponseObject, {
    statusCode: 200,
    body: JSON.stringify(Object.assign({}, { success: true, error: message })),
  })
}
