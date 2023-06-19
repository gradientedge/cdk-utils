import {
  CfnExperimentProps,
  CfnFeatureProps,
  CfnLaunchProps,
  CfnProjectProps,
  CfnSegmentProps,
} from 'aws-cdk-lib/aws-evidently'

/**
 * @category cdk-utils.evidently-manager
 * @subcategory Properties
 */
export interface EvidentlyProjectProps extends CfnProjectProps {}

/**
 * @category cdk-utils.evidently-manager
 * @subcategory Properties
 */
export interface EvidentlyFeatureProps extends CfnFeatureProps {}

/**
 * @category cdk-utils.evidently-manager
 * @subcategory Properties
 */
export interface EvidentlyLaunchProps extends CfnLaunchProps {}

/**
 * @category cdk-utils.evidently-manager
 * @subcategory Properties
 */
export interface EvidentlyExperimentProps extends CfnExperimentProps {}

/**
 * @category cdk-utils.evidently-manager
 * @subcategory Properties
 */
export interface EvidentlySegmentProps extends CfnSegmentProps {}
