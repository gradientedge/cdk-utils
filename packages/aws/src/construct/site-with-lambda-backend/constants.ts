/**
 * Enum for distinguishing between origin and static response header policy types
 */
/** @category Enum */
export enum SiteWithLambdaBackendResponseHeaderPolicyType {
  /** Policy applied to the origin behaviour */
  ORIGIN = 'origin',
  /** Policy applied to the static asset behaviour */
  STATIC = 'static',
}

/**
 * The default alias name used when creating Lambda function URLs with alias support
 */
/** @category Constant */
export const LAMBDA_ALIAS_NAME_CURRENT = 'latest'
