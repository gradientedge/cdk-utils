import {
  CfnExperimentProps,
  CfnFeatureProps,
  CfnLaunchProps,
  CfnProjectProps,
  CfnSegmentProps,
} from 'aws-cdk-lib/aws-evidently'

/**
 * Properties for creating an Evidently project.
 * @see {@link CfnProjectProps}
 */
/** @category Interface */
export interface EvidentlyProjectProps extends CfnProjectProps {}

/**
 * Properties for creating an Evidently feature flag.
 * @see {@link CfnFeatureProps}
 */
/** @category Interface */
export interface EvidentlyFeatureProps extends CfnFeatureProps {}

/**
 * Properties for creating an Evidently launch (gradual feature rollout).
 * @see {@link CfnLaunchProps}
 */
/** @category Interface */
export interface EvidentlyLaunchProps extends CfnLaunchProps {}

/**
 * Properties for creating an Evidently experiment (A/B test).
 * @see {@link CfnExperimentProps}
 */
/** @category Interface */
export interface EvidentlyExperimentProps extends CfnExperimentProps {}

/**
 * Properties for creating an Evidently audience segment.
 * @see {@link CfnSegmentProps}
 */
/** @category Interface */
export interface EvidentlySegmentProps extends CfnSegmentProps {}
