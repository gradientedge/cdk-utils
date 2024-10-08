import * as cdk from 'aws-cdk-lib'
import * as logs from 'aws-cdk-lib/aws-logs'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import * as utils from '../../utils'
import { LogProps, MetricFilterProps } from './types'

/**
 * @classdesc Provides operations on AWS CloudWatch.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.logsManager.createMetricFilter('MyMetricFilter', this, logGroup)
 *   }
 * }
 * @see [CDK CloudWatch Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs-readme.html}
 */
export class LogManager {
  /**
   * @summary Method to create a cloudwatch metric filter
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param logGroup
   */
  public createMetricFilter(id: string, scope: CommonConstruct, props: MetricFilterProps, logGroup: logs.ILogGroup) {
    if (!props) throw `MetricFilter props undefined for ${id}`

    const metricFilter = new logs.MetricFilter(scope, `${id}`, {
      defaultValue: props.defaultValue,
      filterPattern: props.filterPattern,
      logGroup: logGroup,
      metricName: props.metricName,
      metricNamespace: props.metricNamespace,
      metricValue: props.metricValue,
    })

    const metric = props.options
      ? metricFilter.metric({
          dimensionsMap: props.options.dimensionsMap,
          period: props.periodInSecs ? cdk.Duration.seconds(props.periodInSecs) : cdk.Duration.minutes(5),
          statistic: props.options.statistic,
        })
      : metricFilter.metric()

    return { metric, metricFilter }
  }

  /**
   * @summary Method to create a cloudwatch log group (cfn)
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createCfnLogGroup(id: string, scope: CommonConstruct, props: LogProps) {
    if (!props) throw `Logs props undefined for ${id}`
    if (!props.logGroupName) throw `Logs logGroupName undefined for ${id}`

    const logGroup = new logs.CfnLogGroup(scope, `${id}`, {
      ...props,
      logGroupName: props.logGroupName,
      retentionInDays: props.retention,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        cdk.Tags.of(logGroup).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-logGroupArn`, scope, logGroup.attrArn)

    return logGroup
  }

  /**
   * @summary Method to create a cloudwatch log group
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createLogGroup(id: string, scope: CommonConstruct, props: LogProps) {
    if (!props) throw `Logs props undefined for ${id}`
    if (!props.logGroupName) throw `Logs logGroupName undefined for ${id}`

    const logGroup = new logs.LogGroup(scope, `${id}`, {
      ...props,
      logGroupName: props.logGroupName,
      removalPolicy: props.removalPolicy ?? cdk.RemovalPolicy.DESTROY,
      retention: props.retention,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        cdk.Tags.of(logGroup).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-logGroupArn`, scope, logGroup.logGroupArn)

    return logGroup
  }
}
