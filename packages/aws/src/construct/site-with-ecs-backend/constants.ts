/**
 * Enum for distinguishing between origin and static response header policy types
 */
/** @category Enum */
export enum SiteResponseHeaderPolicyType {
  /** Policy applied to the origin behaviour */
  ORIGIN = 'origin',
  /** Policy applied to the static asset behaviour */
  STATIC = 'static',
}
