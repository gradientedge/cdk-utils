import { Tags } from 'aws-cdk-lib'
import { Table, TableV2 } from 'aws-cdk-lib/aws-dynamodb'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { TableProps, TablePropsV2 } from './types'

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
      ...props,
      tableName: `${props.tableName}-${scope.props.stage}`,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(table).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-tableName`, scope, table.tableName)
    createCfnOutput(`${id}-tableArn`, scope, table.tableArn)

    return table
  }

  /**
   * @summary Method to create a table
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props table props
   */
  public createTableV2(id: string, scope: CommonConstruct, props: TablePropsV2) {
    if (!props) throw `Table props undefined for ${id}`
    if (!props.tableName) throw `Table tableName undefined for ${id}`

    const table = new TableV2(scope, `${id}`, {
      ...props,
      tableName: scope.resourceNameFormatter.format(props.tableName, props.resourceNameOptions),
    })

    createCfnOutput(`${id}-tableName`, scope, table.tableName)
    createCfnOutput(`${id}-tableArn`, scope, table.tableArn)

    return table
  }
}
