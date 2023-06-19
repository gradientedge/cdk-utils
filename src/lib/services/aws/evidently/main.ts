import * as evidently from 'aws-cdk-lib/aws-evidently'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'
import {
  EvidentlyExperimentProps,
  EvidentlyFeatureProps,
  EvidentlyLaunchProps,
  EvidentlyProjectProps,
  EvidentlySegmentProps,
} from './types'

/**
 * @classdesc Provides operations on AWS Evidently.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.evidentlyManager.createProject('MyNewProhect', this, props)
 *   }
 * }
 * @see [CDK Evidently Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_evidently-readme.html}
 */
export class EvidentlyManager {
  /**
   * @summary Method to create a project
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the project properties
   */
  public createProject(id: string, scope: CommonConstruct, props: EvidentlyProjectProps) {
    const project = new evidently.CfnProject(scope, `${id}`, {
      ...props,
      description: `${props.description} ${scope.props.stage}`,
      name: `${props.name}-${scope.props.stage}`,
    })
    utils.createCfnOutput(`${id}-projectArn`, scope, project.attrArn)
    utils.createCfnOutput(`${id}-projectName`, scope, project.name)
    return project
  }

  /**
   * @summary Method to create a feature
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the feature properties
   */
  public createFeature(id: string, scope: CommonConstruct, props: EvidentlyFeatureProps) {
    const feature = new evidently.CfnFeature(scope, `${id}`, props)
    utils.createCfnOutput(`${id}-featureArn`, scope, feature.attrArn)
    utils.createCfnOutput(`${id}-featureName`, scope, feature.name)
    return feature
  }

  /**
   * @summary Method to create a launch
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the launch properties
   */
  public createLaunch(id: string, scope: CommonConstruct, props: EvidentlyLaunchProps) {
    const launch = new evidently.CfnLaunch(scope, `${id}`, {
      ...props,
      description: `${props.description} ${scope.props.stage}`,
      name: `${props.name}-${scope.props.stage}`,
    })
    utils.createCfnOutput(`${id}-launchArn`, scope, launch.attrArn)
    utils.createCfnOutput(`${id}-launchName`, scope, launch.name)
    return launch
  }

  /**
   * @summary Method to create an experiment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the experiment properties
   */
  public createExperiment(id: string, scope: CommonConstruct, props: EvidentlyExperimentProps) {
    const experiment = new evidently.CfnExperiment(scope, `${id}`, {
      ...props,
      description: `${props.description} ${scope.props.stage}`,
      name: `${props.name}-${scope.props.stage}`,
    })
    utils.createCfnOutput(`${id}-experimentArn`, scope, experiment.attrArn)
    utils.createCfnOutput(`${id}-experimentName`, scope, experiment.name)
    return experiment
  }

  /**
   * @summary Method to create a segment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the segment properties
   */
  public createSegment(id: string, scope: CommonConstruct, props: EvidentlySegmentProps) {
    const segment = new evidently.CfnSegment(scope, `${id}`, {
      ...props,
      description: `${props.description} ${scope.props.stage}`,
      name: `${props.name}-${scope.props.stage}`,
    })
    utils.createCfnOutput(`${id}-segmentArn`, scope, segment.attrArn)
    utils.createCfnOutput(`${id}-segmentName`, scope, segment.name)
    return segment
  }
}
