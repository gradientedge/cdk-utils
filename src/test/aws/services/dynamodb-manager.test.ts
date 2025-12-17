import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps, TableProps, TablePropsV2 } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {
  testTable: TableProps
  testTableV2: TablePropsV2
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/dynamodb.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testTable: this.node.tryGetContext('testTable'),
        testTableV2: this.node.tryGetContext('testTableV2'),
      },
    }
  }
}

class TestInvalidCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.dynamodbManager.createTable('test-table', this, this.props.testTable)
    this.dynamodbManager.createTableV2('test-table-v2', this, this.props.testTableV2)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestDynamodbConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Table props undefined')
  })
})

describe('TestDynamodbConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testTable')
    expect(commonStack.props.testTable.tableName).toEqual('test-table')
    expect(commonStack.props).toHaveProperty('testTableV2')
    expect(commonStack.props.testTableV2.tableName).toEqual('test-table-v2')
  })
})

describe('TestDynamodbConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::DynamoDB::Table', 1)
  })
})

describe('TestDynamodbConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testTableTableName', {})
    template.hasOutput('testTableTableArn', {})
  })
})

describe('TestDynamodbConstruct', () => {
  test('provisions new table as expected', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      TableName: 'cdktest-test-table-test',
    })
  })
})
