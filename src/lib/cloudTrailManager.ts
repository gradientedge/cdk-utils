import * as cloudtrail from '@aws-cdk/aws-cloudtrail'
import * as logs from '@aws-cdk/aws-logs'
import * as s3 from '@aws-cdk/aws-s3'
import { CommonConstruct } from './commonConstruct'
import { CloudTrailProps } from './types'

export class CloudTrailManager {
  public createCloudTrail(
    id: string,
    scope: CommonConstruct,
    logGroup: logs.CfnLogGroup,
    dataBucket: s3.IBucket,
    logBucket: s3.IBucket,
    logBucketPolicy: s3.CfnBucketPolicy
  ) {
    if (!scope.props.trails || scope.props.trails.length == 0) throw `Cloud Trail props undefined`

    const cloudTrailProps = scope.props.trails.find((log: CloudTrailProps) => log.id === id)
    if (!cloudTrailProps) throw `Could not find Cloud Trail props for id:${id}`

    const role = scope.iamManager.createRoleForCloudTrail(`${id}Role`, scope, logGroup)

    const cloudTrail = new cloudtrail.CfnTrail(scope, `${id}`, {
      cloudWatchLogsLogGroupArn: logGroup.attrArn,
      cloudWatchLogsRoleArn: role.attrArn,
      enableLogFileValidation: cloudTrailProps.enableLogFileValidation,
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
      includeGlobalServiceEvents: cloudTrailProps.includeGlobalServiceEvents,
      isLogging: cloudTrailProps.isLogging,
      isMultiRegionTrail: cloudTrailProps.isMultiRegionTrail,
      s3BucketName: logBucket.bucketName,
      s3KeyPrefix: `logs-${cloudTrailProps.trailName}`,
      tags: [{ key: 'service', value: scope.props.name }],
      trailName: `${cloudTrailProps.trailName}-${scope.props.stage}`,
    })

    cloudTrail.addDependsOn(logBucketPolicy)
    cloudTrail.addDependsOn(logGroup)
    cloudTrail.addDependsOn(role)

    return { cloudTrailRole: role, cloudTrail }
  }
}
