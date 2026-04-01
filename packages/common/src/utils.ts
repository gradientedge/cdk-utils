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
export const isStage = (stage: string, targetStage: Stage) => stage === targetStage

/**
 * @param stage
 */
export const isDevStage = (stage: string) => isStage(stage, Stage.DEV)
/**
 * @param stage
 */
export const isTestStage = (stage: string) => isStage(stage, Stage.TEST)
/**
 * @param stage
 */
export const isUatStage = (stage: string) => isStage(stage, Stage.UAT)
/**
 * @param stage
 */
export const isPrdStage = (stage: string) => isStage(stage, Stage.PROD)
