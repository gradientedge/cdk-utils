import { Tags } from 'aws-cdk-lib'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { CommonConstruct } from '../../../common'
import { createCfnOutput } from '../../../utils'
import { TableProps } from './types'

/**
 * @classdesc Provides operations on AWS DynamoDB
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
 * @see [CDK Certificate Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html}
 */
export class DynamodbManager {
  /**
   * @summary Method to create a table
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props table props
   */
  public createTable(id: string, scope: CommonConstruct, props: TableProps) {
    if (!props) throw `Table props undefined for ${id}`

    const table = new Table(scope, `${id}`, {
      billingMode: props.billingMode,
      contributorInsightsEnabled: props.contributorInsightsEnabled,
      encryption: props.encryption,
      encryptionKey: props.encryptionKey,
      kinesisStream: props.kinesisStream,
      partitionKey: props.partitionKey,
      pointInTimeRecovery: props.pointInTimeRecovery,
      readCapacity: props.readCapacity,
      removalPolicy: props.removalPolicy,
      replicationRegions: props.replicationRegions,
      replicationTimeout: props.replicationTimeout,
      sortKey: props.sortKey,
      stream: props.stream,
      tableName: `${props.tableName}-${scope.props.stage}`,
      timeToLiveAttribute: props.timeToLiveAttribute,
      waitForReplicationToFinish: props.waitForReplicationToFinish,
      writeCapacity: props.writeCapacity,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        Tags.of(table).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-tableName`, scope, table.tableName)
    createCfnOutput(`${id}-tableArn`, scope, table.tableArn)

    return table
  }
}
