export * from './aws'

/**
 * @category cdk-utils.utils
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
 * @category cdk-utils.utils
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
 * @category cdk-utils.utils
 * @param stage
 */
export const isDevStage = (stage: string) => stage === 'dev'
/**
 * @category cdk-utils.utils
 * @param stage
 */
export const isTestStage = (stage: string) => stage === 'tst'
/**
 * @category cdk-utils.utils
 * @param stage
 */
export const isUatStage = (stage: string) => stage === 'uat'
/**
 * @category cdk-utils.utils
 * @param stage
 */
export const isPrdStage = (stage: string) => stage === 'prd'

/**
 * @category cdk-utils.utils
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
 * @category cdk-utils.utils
 * @param message
 */
export function redirectSuccess(message: any) {
  return Object.assign({}, defaultResponseObject, {
    statusCode: 200,
    body: JSON.stringify(Object.assign({}, { success: true, error: message })),
  })
}
