/**
 * Supported application log levels
 */
/** @category Enum */
export enum LogLevel {
  /** Detailed debug-level messages for development troubleshooting */
  DEBUG = 'DEBUG',
  /** Informational messages that highlight the progress of the application */
  INFO = 'INFO',
  /** Potentially harmful situations that warrant attention */
  WARNING = 'WARNING',
  /** Fine-grained diagnostic messages, more verbose than DEBUG */
  TRACE = 'TRACE',
  /** Error events that might still allow the application to continue running */
  ERROR = 'ERROR',
  /** Severe error events that will likely cause the application to abort */
  CRITICAL = 'CRITICAL',
}

/**
 * Supported deployment stages
 */
/** @category Enum */
export enum Stage {
  /** Development stage */
  DEV = 'dev',
  /** Testing stage */
  TEST = 'tst',
  /** User acceptance testing stage */
  UAT = 'uat',
  /** Production stage */
  PROD = 'prd',
}

/**
 * @summary Check whether the given stage matches a target {@link Stage}
 * @param stage - The stage to check
 * @param targetStage - The target stage to compare against
 * @returns true if the stage matches the target stage
 */
/** @category Constant */
export const isStage = (stage: string, targetStage: Stage) => stage === targetStage

/**
 * @summary Check whether the given stage is the development stage
 * @param stage - The stage string to check
 * @returns true if the stage is {@link Stage.DEV}
 */
/** @category Constant */
export const isDevStage = (stage: string) => isStage(stage, Stage.DEV)

/**
 * @summary Check whether the given stage is the test stage
 * @param stage - The stage string to check
 * @returns true if the stage is {@link Stage.TEST}
 */
/** @category Constant */
export const isTestStage = (stage: string) => isStage(stage, Stage.TEST)

/**
 * @summary Check whether the given stage is the UAT stage
 * @param stage - The stage string to check
 * @returns true if the stage is {@link Stage.UAT}
 */
/** @category Constant */
export const isUatStage = (stage: string) => isStage(stage, Stage.UAT)

/**
 * @summary Check whether the given stage is the production stage
 * @param stage - The stage string to check
 * @returns true if the stage is {@link Stage.PROD}
 */
/** @category Constant */
export const isPrdStage = (stage: string) => isStage(stage, Stage.PROD)
