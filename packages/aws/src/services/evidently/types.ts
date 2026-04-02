import {
  CfnExperimentProps,
  CfnFeatureProps,
  CfnLaunchProps,
  CfnProjectProps,
  CfnSegmentProps,
} from 'aws-cdk-lib/aws-evidently'

/**
 */
/** @category Interface */
export interface EvidentlyProjectProps extends CfnProjectProps {}

/**
 */
/** @category Interface */
export interface EvidentlyFeatureProps extends CfnFeatureProps {}

/**
 */
/** @category Interface */
export interface EvidentlyLaunchProps extends CfnLaunchProps {}

/**
 */
/** @category Interface */
export interface EvidentlyExperimentProps extends CfnExperimentProps {}

/**
 */
/** @category Interface */
export interface EvidentlySegmentProps extends CfnSegmentProps {}
