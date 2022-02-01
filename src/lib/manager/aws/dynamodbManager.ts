import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category Storage
 * @summary Provides operations on AWS DynamoDB.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
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
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TableProps} props table props
   */
  public createTable(id: string, scope: common.CommonConstruct, props: types.TableProps) {
    if (!props) throw `Table props undefined`

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

    utils.createCfnOutput(`${id}-tableName`, scope, table.tableName)
    utils.createCfnOutput(`${id}-tableArn`, scope, table.tableArn)

    return table
  }
}
