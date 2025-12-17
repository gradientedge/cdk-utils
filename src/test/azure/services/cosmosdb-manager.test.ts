import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  CosmosdbAccountProps,
  CosmosdbSqlContainerProps,
  CosmosdbSqlDatabaseProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testCosmosDbAccount: CosmosdbAccountProps
  testCosmosDbDatabase: CosmosdbSqlDatabaseProps
  testCosmosDbContainer: CosmosdbSqlContainerProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/cosmosdb.json'],
  features: {},
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, props.name, this.props)
  }

  protected determineConstructProps(props: CommonAzureStackProps) {
    return {
      ...super.determineConstructProps(props),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testCosmosDbAccount: this.node.tryGetContext('testCosmosDbAccount'),
      testCosmosDbDatabase: this.node.tryGetContext('testCosmosDbDatabase'),
      testCosmosDbContainer: this.node.tryGetContext('testCosmosDbContainer'),
    }
  }
}

class TestInvalidCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)
    this.cosmosDbManager.createCosmosDbAccount(
      `test-cosmosdb-account-${this.props.stage}`,
      this,
      this.props.testCosmosDbAccount
    )

    this.cosmosDbManager.createCosmosDbDatabase(
      `test-cosmosdb-database-${this.props.stage}`,
      this,
      this.props.testCosmosDbDatabase
    )

    this.cosmosDbManager.createCosmosDbContainer(
      `test-cosmosdb-container-${this.props.stage}`,
      this,
      this.props.testCosmosDbContainer
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureCosmosDbConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-cosmosdb-account-dev')
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(Testing.toBeValidTerraform(stack)).toBeTruthy()
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testCosmosdbAccountDevCosmosdbAccountFriendlyUniqueId: {
        value: 'test-cosmosdb-account-dev-ca',
      },
      testCosmosdbAccountDevCosmosdbAccountId: {
        value: '${azurerm_cosmosdb_account.test-cosmosdb-account-dev-ca.id}',
      },
      testCosmosdbAccountDevCosmosdbAccountName: {
        value: '${azurerm_cosmosdb_account.test-cosmosdb-account-dev-ca.name}',
      },
    })
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions cosmosdb account as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'CosmosdbAccount', {
        consistency_policy: {
          consistency_level: 'Strong',
        },
        location: '${data.azurerm_resource_group.test-cosmosdb-account-dev-ca-rg.location}',
        name: 'test-cosmosdb-account-dev',
        offer_type: 'Standard',
        resource_group_name: '${data.azurerm_resource_group.test-cosmosdb-account-dev-ca-rg.name}',
        tags: {
          environment: 'dev',
        },
      })
    )
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions cosmosdb database as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'CosmosdbSqlDatabase', {
        name: 'test-cosmosdb-database-dev',
        resource_group_name: '${data.azurerm_resource_group.test-cosmosdb-database-dev-cd-rg.name}',
      })
    )
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions cosmosdb container as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'CosmosdbSqlContainer', {
        indexing_policy: {
          composite_index: [
            {
              index: [
                {
                  order: 'Ascending',
                  path: '/assetTypeAndKey',
                },
                {
                  order: 'Ascending',
                  path: '/assetType',
                },
              ],
            },
          ],
          excluded_path: [
            {
              path: '/*',
            },
          ],
          included_path: [
            {
              path: '/*',
            },
          ],
        },
        name: 'test-cosmosdb-container-dev',
        partition_key_paths: ['/testPartitionKey'],
        resource_group_name: '${data.azurerm_resource_group.test-cosmosdb-container-dev-cc-rg.name}',
      })
    )
  })
})
