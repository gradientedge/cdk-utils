import { CfnExperiment, CfnFeature, CfnLaunch, CfnProject, CfnSegment } from 'aws-cdk-lib/aws-evidently'
import { CommonConstruct } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'
import {
  EvidentlyExperimentProps,
  EvidentlyFeatureProps,
  EvidentlyLaunchProps,
  EvidentlyProjectProps,
  EvidentlySegmentProps,
} from './types.js'

/**
 * @classdesc Provides operations on AWS Evidently
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
    if (!props) throw `EvidentlyProject props undefined for ${id}`
    if (!props.name) throw `EvidentlyProject name undefined for ${id}`

    const project = new CfnProject(scope, `${id}`, {
      ...props,
      description: `${props.description} ${scope.props.stage}`,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.evidentlyProject),
    })
    createCfnOutput(`${id}-projectArn`, scope, project.attrArn)
    createCfnOutput(`${id}-projectName`, scope, project.name)
    return project
  }

  /**
   * @summary Method to create a feature
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the feature properties
   */
  public createFeature(id: string, scope: CommonConstruct, props: EvidentlyFeatureProps) {
    if (!props) throw `EvidentlyFeature props undefined for ${id}`

    const feature = new CfnFeature(scope, `${id}`, props)
    createCfnOutput(`${id}-featureArn`, scope, feature.attrArn)
    createCfnOutput(`${id}-featureName`, scope, feature.name)
    return feature
  }

  /**
   * @summary Method to create a launch
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the launch properties
   */
  public createLaunch(id: string, scope: CommonConstruct, props: EvidentlyLaunchProps) {
    if (!props) throw `EvidentlyLaunch props undefined for ${id}`
    if (!props.name) throw `EvidentlyLaunch name undefined for ${id}`

    const launch = new CfnLaunch(scope, `${id}`, {
      ...props,
      description: `${props.description} ${scope.props.stage}`,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.evidentlyLaunch),
    })
    createCfnOutput(`${id}-launchArn`, scope, launch.attrArn)
    createCfnOutput(`${id}-launchName`, scope, launch.name)
    return launch
  }

  /**
   * @summary Method to create an experiment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the experiment properties
   */
  public createExperiment(id: string, scope: CommonConstruct, props: EvidentlyExperimentProps) {
    if (!props) throw `EvidentlyExperiment props undefined for ${id}`
    if (!props.name) throw `EvidentlyExperiment name undefined for ${id}`

    const experiment = new CfnExperiment(scope, `${id}`, {
      ...props,
      description: `${props.description} ${scope.props.stage}`,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.evidentlyExperiment),
    })
    createCfnOutput(`${id}-experimentArn`, scope, experiment.attrArn)
    createCfnOutput(`${id}-experimentName`, scope, experiment.name)
    return experiment
  }

  /**
   * @summary Method to create a segment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the segment properties
   */
  public createSegment(id: string, scope: CommonConstruct, props: EvidentlySegmentProps) {
    if (!props) throw `EvidentlySegment props undefined for ${id}`
    if (!props.name) throw `EvidentlySegment name undefined for ${id}`

    const segment = new CfnSegment(scope, `${id}`, {
      ...props,
      description: `${props.description} ${scope.props.stage}`,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.evidentlySegment),
    })
    createCfnOutput(`${id}-segmentArn`, scope, segment.attrArn)
    createCfnOutput(`${id}-segmentName`, scope, segment.name)
    return segment
  }
}
