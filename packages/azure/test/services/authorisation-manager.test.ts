import { PrincipalType, RoleAssignment } from '@pulumi/azure-native/authorization/index.js'
import * as pulumi from '@pulumi/pulumi'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps, RoleDefinitionId } from '../../src/index.js'
import { outputToPromise } from '../helpers.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  roleAssignment: RoleAssignment
  storageTableRole: RoleAssignment
  storageAccountRole: RoleAssignment
  appConfigRole: RoleAssignment

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.roleAssignment = this.authorisationManager.createRoleAssignment(`test-role-${this.props.stage}`, this, {
      principalId: 'test-principal-id',
      roleDefinitionId: RoleDefinitionId.KEY_VAULT_SECRETS_USER,
      scope: '/subscriptions/test-sub/resourceGroups/test-rg',
    })

    this.storageTableRole = this.authorisationManager.grantRoleAssignmentToStorageTable(
      `test-st-role-${this.props.stage}`,
      this,
      '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testsa/tableServices/default/tables/testtable',
      'test-principal-id',
      RoleDefinitionId.STORAGE_TABLE_DATA_CONTRIBUTOR
    )

    this.storageAccountRole = this.authorisationManager.grantRoleAssignmentToStorageAccount(
      `test-sa-role-${this.props.stage}`,
      this,
      '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testsa',
      'test-principal-id',
      RoleDefinitionId.STORAGE_BLOB_DATA_CONTRIBUTOR
    )

    this.appConfigRole = this.authorisationManager.grantRoleAssignmentToApplicationConfiguration(
      `test-ac-role-${this.props.stage}`,
      this,
      '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.AppConfiguration/configurationStores/testac',
      'test-principal-id',
      PrincipalType.ServicePrincipal,
      RoleDefinitionId.APP_CONFIGURATION_DATA_READER
    )
  }
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name: args.name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureAuthorisationConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.roleAssignment).toBeDefined()
    expect(stack.construct.storageTableRole).toBeDefined()
    expect(stack.construct.storageAccountRole).toBeDefined()
    expect(stack.construct.appConfigRole).toBeDefined()
  })
})

describe('TestAzureAuthorisationConstruct', () => {
  test('provisions role assignment as expected', async () => {
    await outputToPromise(
      pulumi.all([stack.construct.roleAssignment.id]).apply(([id]) => {
        expect(id).toBeDefined()
      })
    )
  })

  test('provisions storage table role assignment as expected', async () => {
    await outputToPromise(
      pulumi.all([stack.construct.storageTableRole.id]).apply(([id]) => {
        expect(id).toBeDefined()
      })
    )
  })

  test('provisions storage account role assignment as expected', async () => {
    await outputToPromise(
      pulumi.all([stack.construct.storageAccountRole.id]).apply(([id]) => {
        expect(id).toBeDefined()
      })
    )
  })

  test('provisions app configuration role assignment as expected', async () => {
    await outputToPromise(
      pulumi.all([stack.construct.appConfigRole.id]).apply(([id]) => {
        expect(id).toBeDefined()
      })
    )
  })
})

describe('TestAzureAuthorisationConstruct - Error Handling', () => {
  test('createRoleAssignment throws when props are undefined', () => {
    expect(() => {
      stack.construct.authorisationManager.createRoleAssignment('test-role-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-role-err')
  })
})
