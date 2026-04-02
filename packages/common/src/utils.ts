/**
 */
/** @category Enum */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  TRACE = 'TRACE',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/** @category Enum */
export enum Stage {
  DEV = 'dev',
  TEST = 'tst',
  UAT = 'uat',
  PROD = 'prd',
}

/**
 * @param stage - The stage to check
 * @param targetStage - The target stage to compare against
 */
/** @category Constant */
export const isStage = (stage: string, targetStage: Stage) => stage === targetStage

/**
 * @param stage
 */
/** @category Constant */
export const isDevStage = (stage: string) => isStage(stage, Stage.DEV)
/**
 * @param stage
 */
/** @category Constant */
export const isTestStage = (stage: string) => isStage(stage, Stage.TEST)
/**
 * @param stage
 */
/** @category Constant */
export const isUatStage = (stage: string) => isStage(stage, Stage.UAT)
/**
 * @param stage
 */
/** @category Constant */
export const isPrdStage = (stage: string) => isStage(stage, Stage.PROD)
