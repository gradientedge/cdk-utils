import {
  DatabaseAccount,
  SqlResourceSqlContainer,
  SqlResourceSqlDatabase,
} from '@pulumi/azure-native/cosmosdb/index.js'
import * as pulumi from '@pulumi/pulumi'
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
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

class TestInvalidCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestCommonConstruct(testStackProps.name, this.props)
  }

  protected determineConstructProps(props: TestAzureStackProps): TestAzureStackProps {
    const baseProps = super.determineConstructProps(props)
    // Override the test property to undefined to trigger validation error
    return { ...baseProps, testCosmosDbAccount: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  cosmosDbAccount: DatabaseAccount
  cosmosDbDatabase: SqlResourceSqlDatabase
  cosmosDbContainer: SqlResourceSqlContainer

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.cosmosDbAccount = this.cosmosDbManager.createCosmosDbAccount(
      `test-cosmosdb-account-${this.props.stage}`,
      this,
      this.props.testCosmosDbAccount
    )

    this.cosmosDbDatabase = this.cosmosDbManager.createCosmosDbDatabase(
      `test-cosmosdb-database-${this.props.stage}`,
      this,
      this.props.testCosmosDbDatabase
    )

    this.cosmosDbContainer = this.cosmosDbManager.createCosmosDbContainer(
      `test-cosmosdb-container-${this.props.stage}`,
      this,
      this.props.testCosmosDbContainer
    )
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name = args.inputs.name

    // Return different names based on resource type
    if (args.type === 'azure-native:cosmosdb:DatabaseAccount') {
      name = args.inputs.accountName
    } else if (args.type === 'azure-native:cosmosdb:SqlResourceSqlDatabase') {
      name = args.inputs.databaseName
    } else if (args.type === 'azure-native:cosmosdb:SqlResourceSqlContainer') {
      name = args.inputs.containerName
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureCosmosDbConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-cosmosdb-account-dev')
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.cosmosDbAccount).toBeDefined()
    expect(stack.construct.cosmosDbDatabase).toBeDefined()
    expect(stack.construct.cosmosDbContainer).toBeDefined()
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions cosmosdb account as expected', () => {
    pulumi
      .all([
        stack.construct.cosmosDbAccount.id,
        stack.construct.cosmosDbAccount.urn,
        stack.construct.cosmosDbAccount.name,
        stack.construct.cosmosDbAccount.location,
        stack.construct.cosmosDbAccount.consistencyPolicy,
        stack.construct.cosmosDbAccount.tags,
      ])
      .apply(([id, urn, name, location, consistencyPolicy, tags]) => {
        expect(id).toEqual('test-cosmosdb-account-dev-ca-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:cosmosdb:DatabaseAccount::test-cosmosdb-account-dev-ca'
        )
        expect(name).toEqual('test-cosmosdb-account-dev')
        expect(location).toEqual('eastus')
        expect(consistencyPolicy).toEqual({ defaultConsistencyLevel: 'Strong' })
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions cosmosdb database as expected', () => {
    pulumi
      .all([
        stack.construct.cosmosDbDatabase.id,
        stack.construct.cosmosDbDatabase.urn,
        stack.construct.cosmosDbDatabase.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-cosmosdb-database-dev-cd-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:cosmosdb:SqlResourceSqlDatabase::test-cosmosdb-database-dev-cd'
        )
        expect(name).toEqual('test-cosmosdb-database-dev')
      })
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions cosmosdb container as expected', () => {
    pulumi
      .all([
        stack.construct.cosmosDbContainer.id,
        stack.construct.cosmosDbContainer.urn,
        stack.construct.cosmosDbContainer.name,
        stack.construct.cosmosDbContainer.resource,
      ])
      .apply(([id, urn, name, resource]) => {
        expect(id).toEqual('test-cosmosdb-container-dev-cc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:cosmosdb:SqlResourceSqlContainer::test-cosmosdb-container-dev-cc'
        )
        expect(name).toEqual('test-cosmosdb-container-dev')
        expect(resource).toEqual({
          id: 'test-cosmosdb-container',
          partitionKey: { kind: 'Hash', paths: ['/testPartitionKey'] },
        })
      })
  })
})
