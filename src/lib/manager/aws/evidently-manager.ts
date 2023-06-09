import * as evidently from 'aws-cdk-lib/aws-evidently'
import * as common from '../../common'
import * as types from '../../types/aws'
import * as utils from '../../utils'
import { EvidentlyExperimentProps, EvidentlySegmentProps } from '../../types/aws'

/**
 * @stability stable
 * @category cdk-utils.evidently-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Evidently.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.eventManager.createProject('MyNewProhect', this, props)
 *   }
 * }
 *
 * @see [CDK Evidently Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_evidently-readme.html}
 */
export class EvidentlyManager {
  /**
   * @summary Method to create a project
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {EvidentlyProjectProps} props the project properties
   */
  public createProject(id: string, scope: common.CommonConstruct, props: types.EvidentlyProjectProps) {
    const project = new evidently.CfnProject(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      description: `${props.description} ${scope.props.stage}`,
    })
    utils.createCfnOutput(`${id}-projectArn`, scope, project.attrArn)
    utils.createCfnOutput(`${id}-projectName`, scope, project.name)
    return project
  }

  /**
   * @summary Method to create a feature
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {EvidentlyFeatureProps} props the feature properties
   */
  public createFeature(id: string, scope: common.CommonConstruct, props: types.EvidentlyFeatureProps) {
    const feature = new evidently.CfnFeature(scope, `${id}`, props)
    utils.createCfnOutput(`${id}-featureArn`, scope, feature.attrArn)
    utils.createCfnOutput(`${id}-featureName`, scope, feature.name)
    return feature
  }

  /**
   * @summary Method to create a launch
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {EvidentlyLaunchProps} props the launch properties
   */
  public createLaunch(id: string, scope: common.CommonConstruct, props: types.EvidentlyLaunchProps) {
    const launch = new evidently.CfnLaunch(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      description: `${props.description} ${scope.props.stage}`,
    })
    utils.createCfnOutput(`${id}-launchArn`, scope, launch.attrArn)
    utils.createCfnOutput(`${id}-launchName`, scope, launch.name)
    return launch
  }

  /**
   * @summary Method to create an experiment
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {EvidentlyExperimentProps} props the experiment properties
   */
  public createExperiment(id: string, scope: common.CommonConstruct, props: types.EvidentlyExperimentProps) {
    const experiment = new evidently.CfnExperiment(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      description: `${props.description} ${scope.props.stage}`,
    })
    utils.createCfnOutput(`${id}-experimentArn`, scope, experiment.attrArn)
    utils.createCfnOutput(`${id}-experimentName`, scope, experiment.name)
    return experiment
  }

  /**
   * @summary Method to create a segment
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {EvidentlySegmentProps} props the segment properties
   */
  public createSegment(id: string, scope: common.CommonConstruct, props: types.EvidentlySegmentProps) {
    const segment = new evidently.CfnSegment(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      description: `${props.description} ${scope.props.stage}`,
    })
    utils.createCfnOutput(`${id}-segmentArn`, scope, segment.attrArn)
    utils.createCfnOutput(`${id}-segmentName`, scope, segment.name)
    return segment
  }
}
