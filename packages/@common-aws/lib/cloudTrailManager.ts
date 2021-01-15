import * as cloudtrail from '@aws-cdk/aws-cloudtrail'
import * as logs from '@aws-cdk/aws-logs'
import * as s3 from '@aws-cdk/aws-s3'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'

export interface CloudTrailProps extends logs.CfnLogGroupProps {
  key: string
}

export class CloudTrailManager {
  public createCloudTrail(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    logGroup: logs.CfnLogGroup | logs.ILogGroup,
    dataBucket: s3.IBucket,
    logBucket: s3.IBucket,
    logBucketPolicy: s3.CfnBucketPolicy
  ) {
    if (!props.trails || props.trails.length == 0) throw `Cloud Trail props undefined`

    const cloudTrailProps = props.trails.find((log: CloudTrailProps) => log.key === key)
    if (!cloudTrailProps) throw `Could not find Cloud Trail props for key:${key}`

    const role = scope.iamManager.createRoleForCloudTrail(id, scope, props)

    const cloudTrail = new cloudtrail.CfnTrail(scope, `${id}`, {
      cloudWatchLogsLogGroupArn:
        logGroup instanceof logs.CfnLogGroup ? logGroup.attrArn : logGroup.logGroupArn,
      cloudWatchLogsRoleArn: role.attrArn,
      enableLogFileValidation: false,
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
      includeGlobalServiceEvents: false,
      isLogging: true,
      isMultiRegionTrail: false,
      s3BucketName: logBucket.bucketName,
      s3KeyPrefix: `logs-${id}`,
      tags: [{ key: 'service', value: props.name }],
      trailName: `${id}-${props.stage}`,
    })

    cloudTrail.addDependsOn(logBucketPolicy)
    if (logGroup instanceof logs.CfnLogGroup) cloudTrail.addDependsOn(logGroup)
    cloudTrail.addDependsOn(role)

    return { cloudTrailRole: role, cloudTrail }
  }
}
