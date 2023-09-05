import {
  CfnExperimentProps,
  CfnFeatureProps,
  CfnLaunchProps,
  CfnProjectProps,
  CfnSegmentProps,
} from 'aws-cdk-lib/aws-evidently'

/**
 */
export interface EvidentlyProjectProps extends CfnProjectProps {}

/**
 */
export interface EvidentlyFeatureProps extends CfnFeatureProps {}

/**
 */
export interface EvidentlyLaunchProps extends CfnLaunchProps {}

/**
 */
export interface EvidentlyExperimentProps extends CfnExperimentProps {}

/**
 */
export interface EvidentlySegmentProps extends CfnSegmentProps {}
