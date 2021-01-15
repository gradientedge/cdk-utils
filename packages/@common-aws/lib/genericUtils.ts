import * as cdk from '@aws-cdk/core'
import * as _ from 'lodash'
import { CommonConstruct } from './commonConstruct'

const defaultResponseObject = {
  statusCode: 200,
  body: '',
  isBase64Encoded: false,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
}

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

export function redirectError(error: any) {
  console.error(error, error.message, error.stack)
  return Object.assign({}, defaultResponseObject, {
    statusCode: 500,
    body: JSON.stringify(Object.assign({}, { success: false, error: error.message })),
  })
}

export function redirectSuccess(message: any) {
  return Object.assign({}, defaultResponseObject, {
    statusCode: 200,
    body: JSON.stringify(Object.assign({}, { success: true, error: message })),
  })
}
