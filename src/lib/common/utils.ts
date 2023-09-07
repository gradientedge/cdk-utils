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
