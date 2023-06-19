export * from './aws'

/**
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
 * @param stage
 */
export const isDevStage = (stage: string) => stage === 'dev'
/**
 * @param stage
 */
export const isTestStage = (stage: string) => stage === 'tst'
/**
 * @param stage
 */
export const isUatStage = (stage: string) => stage === 'uat'
/**
 * @param stage
 */
export const isPrdStage = (stage: string) => stage === 'prd'

/**
 * @param error
 */
export function redirectError(error: any) {
  console.error(error, error.message, error.stack)
  return Object.assign({}, defaultResponseObject, {
    body: JSON.stringify(Object.assign({}, { error: error.message, success: false })),
    statusCode: 500,
  })
}

/**
 * @param message
 */
export function redirectSuccess(message: any) {
  return Object.assign({}, defaultResponseObject, {
    body: JSON.stringify(Object.assign({}, { error: message, success: true })),
    statusCode: 200,
  })
}
