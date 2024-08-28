import {
  CfnExperimentProps,
  CfnFeatureProps,
  CfnLaunchProps,
  CfnProjectProps,
  CfnSegmentProps,
} from 'aws-cdk-lib/aws-evidently'
import { ResourceNameFormatterProps } from '../../common'

/**
 */
export interface EvidentlyProjectProps extends CfnProjectProps {
  resourceNameOptions?: ResourceNameFormatterProps
}

/**
 */
export interface EvidentlyFeatureProps extends CfnFeatureProps {}

/**
 */
export interface EvidentlyLaunchProps extends CfnLaunchProps {
  resourceNameOptions?: ResourceNameFormatterProps
}

/**
 */
export interface EvidentlyExperimentProps extends CfnExperimentProps {
  resourceNameOptions?: ResourceNameFormatterProps
}

/**
 */
export interface EvidentlySegmentProps extends CfnSegmentProps {
  resourceNameOptions?: ResourceNameFormatterProps
}
