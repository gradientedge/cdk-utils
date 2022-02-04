export * from './aws'

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
 * @category Utils
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
