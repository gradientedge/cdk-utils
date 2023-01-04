import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.cloudtrail-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS CloudTrail.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.cloudTrailManager.createCloudTrail(
 *       'MyTrail',
 *       this,
 *       logGroup,
 *       dataBucket,
 *       logBucket,
 *       logBucketPolicy
 *     )
 *   }
 * }
 *
 * @see [CDK CloudTrail Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudtrail-readme.html}
 */
export class CloudTrailManager {
  /**
   * @summary Method to create a cloud trail
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.CloudTrailProps} props
   * @param {logs.CfnLogGroup} logGroup
   * @param {s3.IBucket} dataBucket
   * @param {s3.IBucket} logBucket
   * @param {s3.CfnBucketPolicy} logBucketPolicy
   */
  public createCloudTrail(
    id: string,
    scope: common.CommonConstruct,
    props: types.CloudTrailProps,
    logGroup: logs.CfnLogGroup,
    dataBucket: s3.IBucket,
    logBucket: s3.IBucket,
    logBucketPolicy: s3.CfnBucketPolicy
  ) {
    if (!props) throw `CloudTrail props undefined for ${id}`

    const role = scope.iamManager.createRoleForCloudTrail(`${id}Role`, scope, logGroup)

    const cloudTrail = new cloudtrail.CfnTrail(scope, `${id}`, {
      cloudWatchLogsLogGroupArn: logGroup.attrArn,
      cloudWatchLogsRoleArn: role.attrArn,
      enableLogFileValidation: props.enableLogFileValidation,
      eventSelectors: [
        {
          dataResources: [
            {
              type: 'AWS::S3::Object',
              values: [dataBucket.arnForObjects('')],
            },
          ],
          includeManagementEvents: false,
          readWriteType: 'WriteOnly',
        },
      ],
      includeGlobalServiceEvents: props.includeGlobalServiceEvents,
      isLogging: props.isLogging,
      isMultiRegionTrail: props.isMultiRegionTrail,
      s3BucketName: logBucket.bucketName,
      s3KeyPrefix: `logs-${props.trailName}`,
      tags: [{ key: 'service', value: scope.props.name }],
      trailName: `${props.trailName}-${scope.props.stage}`,
    })

    cloudTrail.addDependency(logBucketPolicy)
    cloudTrail.addDependency(logGroup)
    cloudTrail.addDependency(role)

    utils.createCfnOutput(`${id}-trailName`, scope, cloudTrail.trailName)
    utils.createCfnOutput(`${id}-trailArn`, scope, cloudTrail.attrArn)

    return { cloudTrailRole: role, cloudTrail }
  }
}
