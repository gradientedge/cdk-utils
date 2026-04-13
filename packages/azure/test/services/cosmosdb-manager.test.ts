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
  CosmosRoleDefinition,
} from '../../src/index.js'
import { outputToPromise } from '../helpers.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testCosmosDbAccount: CosmosdbAccountProps
  testCosmosDbDatabase: CosmosdbSqlDatabaseProps
  testCosmosDbContainer: CosmosdbSqlContainerProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/cosmosdb.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
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

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

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

  test('createCosmosDbDatabase throws when props are undefined', () => {
    expect(() => {
      stack.construct.cosmosDbManager.createCosmosDbDatabase('test-db-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-db-err')
  })

  test('createCosmosDbContainer throws when props are undefined', () => {
    expect(() => {
      stack.construct.cosmosDbManager.createCosmosDbContainer('test-container-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-container-err')
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
  test('provisions cosmosdb account as expected', async () => {
    await outputToPromise(
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
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:cosmosdb:DatabaseAccount::test-cosmosdb-account-dev-ca'
          )
          expect(name).toEqual('test-cosmosdb-account-dev')
          expect(location).toEqual('eastus')
          expect(consistencyPolicy).toEqual({ defaultConsistencyLevel: 'Strong' })
          expect(tags?.environment).toEqual('dev')
        })
    )
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions cosmosdb database as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.cosmosDbDatabase.id,
          stack.construct.cosmosDbDatabase.urn,
          stack.construct.cosmosDbDatabase.name,
        ])
        .apply(([id, urn, name]) => {
          expect(id).toEqual('test-cosmosdb-database-dev-cd-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:cosmosdb:SqlResourceSqlDatabase::test-cosmosdb-database-dev-cd'
          )
          expect(name).toEqual('test-cosmosdb-database-dev')
        })
    )
  })
})

describe('TestAzureCosmosDbConstruct', () => {
  test('provisions cosmosdb container as expected', async () => {
    await outputToPromise(
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
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:cosmosdb:SqlResourceSqlContainer::test-cosmosdb-container-dev-cc'
          )
          expect(name).toEqual('test-cosmosdb-container-dev')
          expect(resource).toEqual({
            id: 'test-cosmosdb-container',
            partitionKey: { kind: 'Hash', paths: ['/testPartitionKey'] },
          })
        })
    )
  })
})

/* --- Tests for default value fallback branches --- */
class TestMinimalCosmosConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  cosmosDbAccount: DatabaseAccount

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    // CosmosDB account with minimal props - exercises location/tags/identity defaults
    this.cosmosDbAccount = this.cosmosDbManager.createCosmosDbAccount(`test-minimal-cosmos-${this.props.stage}`, this, {
      accountName: 'test-minimal-cosmos',
      resourceGroupName: 'test-rg-dev',
      databaseAccountOfferType: 'Standard',
      consistencyPolicy: { defaultConsistencyLevel: 'Session' },
      locations: [{ locationName: 'eastus', failoverPriority: 0 }],
    } as any)
  }
}

class TestMinimalCosmosStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestMinimalCosmosConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalCosmosConstruct(props.name, this.props)
  }
}

const minimalCosmosStack = new TestMinimalCosmosStack('test-minimal-cosmos-stack', testStackProps)

describe('TestAzureCosmosDbConstruct - Default Values', () => {
  test('cosmosdb account uses default location from scope when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalCosmosStack.construct.cosmosDbAccount.location]).apply(([location]) => {
        expect(location).toEqual('eastus')
      })
    )
  })

  test('cosmosdb account uses default tags when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalCosmosStack.construct.cosmosDbAccount.tags]).apply(([tags]) => {
        expect(tags?.environment).toEqual('dev')
      })
    )
  })

  test('cosmosdb account uses default identity when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalCosmosStack.construct.cosmosDbAccount.identity]).apply(([identity]) => {
        expect(identity?.type).toEqual('SystemAssigned')
      })
    )
  })
})

/* --- Tests for grantSqlRoleDefinitionToAccount --- */

class TestConstructWithRoleGrant extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.cosmosDbManager.grantSqlRoleDefinitionToAccount(
      `test-role-grant-${this.props.stage}`,
      this,
      'test-cosmos-account',
      'test-rg-dev',
      'test-principal-id',
      [CosmosRoleDefinition.CONTRIBUTOR, CosmosRoleDefinition.READER]
    )
  }
}

class TestStackWithRoleGrant extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithRoleGrant

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithRoleGrant(props.name, this.props)
  }
}

const stackWithRoleGrant = new TestStackWithRoleGrant('test-role-grant-stack', testStackProps)

describe('TestAzureCosmosDbConstruct - grantSqlRoleDefinitionToAccount', () => {
  test('grants both contributor and reader roles', () => {
    expect(stackWithRoleGrant.construct).toBeDefined()
  })
})

class TestConstructWithContributorOnly extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.cosmosDbManager.grantSqlRoleDefinitionToAccount(
      `test-role-contrib-${this.props.stage}`,
      this,
      'test-cosmos-account',
      'test-rg-dev',
      'test-principal-id',
      [CosmosRoleDefinition.CONTRIBUTOR]
    )
  }
}

class TestStackWithContributorOnly extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithContributorOnly

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithContributorOnly(props.name, this.props)
  }
}

const stackContributorOnly = new TestStackWithContributorOnly('test-contrib-only-stack', testStackProps)

describe('TestAzureCosmosDbConstruct - grantSqlRoleDefinitionToAccount Contributor Only', () => {
  test('grants only contributor role', () => {
    expect(stackContributorOnly.construct).toBeDefined()
  })
})

class TestConstructWithReaderOnly extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.cosmosDbManager.grantSqlRoleDefinitionToAccount(
      `test-role-reader-${this.props.stage}`,
      this,
      'test-cosmos-account',
      'test-rg-dev',
      'test-principal-id',
      [CosmosRoleDefinition.READER]
    )
  }
}

class TestStackWithReaderOnly extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithReaderOnly

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithReaderOnly(props.name, this.props)
  }
}

const stackReaderOnly = new TestStackWithReaderOnly('test-reader-only-stack', testStackProps)

describe('TestAzureCosmosDbConstruct - grantSqlRoleDefinitionToAccount Reader Only', () => {
  test('grants only reader role', () => {
    expect(stackReaderOnly.construct).toBeDefined()
  })
})
