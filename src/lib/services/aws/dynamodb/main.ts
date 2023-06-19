import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as utils from '../../../utils'
import * as cdk from 'aws-cdk-lib'
import { CommonConstruct } from '../../../common'
import { TableProps } from './types'

/**
 * @stability stable
 * @category cdk-utils.dynamodb-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS DynamoDB.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.dynamodbManager.createTable('MyTable', this, tableProps)
 *   }
 * }
 *
 * @see [CDK Certificate Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html}
 */
export class DynamodbManager {
  /**
   * @summary Method to create a table
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {TableProps} props table props
   */
  public createTable(id: string, scope: CommonConstruct, props: TableProps) {
    if (!props) throw `Table props undefined for ${id}`

    const table = new dynamodb.Table(scope, `${id}`, {
      tableName: `${props.tableName}-${scope.props.stage}`,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      kinesisStream: props.kinesisStream,
      readCapacity: props.readCapacity,
      writeCapacity: props.writeCapacity,
      billingMode: props.billingMode,
      pointInTimeRecovery: props.pointInTimeRecovery,
      encryption: props.encryption,
      encryptionKey: props.encryptionKey,
      timeToLiveAttribute: props.timeToLiveAttribute,
      stream: props.stream,
      removalPolicy: props.removalPolicy,
      replicationRegions: props.replicationRegions,
      replicationTimeout: props.replicationTimeout,
      waitForReplicationToFinish: props.waitForReplicationToFinish,
      contributorInsightsEnabled: props.contributorInsightsEnabled,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(table).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-tableName`, scope, table.tableName)
    utils.createCfnOutput(`${id}-tableArn`, scope, table.tableArn)

    return table
  }
}
