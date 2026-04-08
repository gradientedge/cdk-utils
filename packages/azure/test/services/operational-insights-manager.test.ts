import * as pulumi from '@pulumi/pulumi'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps, WorkspaceProps } from '../../src/index.js'
import { Workspace } from '@pulumi/azure-native/operationalinsights/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testWorkspace: WorkspaceProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/workspace.json'],
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
    return { ...baseProps, testWorkspace: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  workspace: Workspace

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.workspace = this.operationalInsightsManager.createWorkspace(
      `test-workspace-${this.props.stage}`,
      this,
      this.props.testWorkspace
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
    let name

    if (args.type === 'azure-native:operationalinsights:Workspace') {
      name = args.inputs.workspaceName
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

describe('TestOperationalInsightsConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-workspace-dev')
  })
})

describe('TestOperationalInsightsConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestOperationalInsightsConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.workspace).toBeDefined()
  })
})

describe('TestOperationalInsightsConstruct', () => {
  test('provisions workspace as expected', () => {
    pulumi
      .all([
        stack.construct.workspace.id,
        stack.construct.workspace.urn,
        stack.construct.workspace.name,
        stack.construct.workspace.location,
        stack.construct.workspace.tags,
      ])
      .apply(([id, urn, name, location, tags]) => {
        expect(id).toEqual('test-workspace-dev-lw-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:operationalinsights:Workspace::test-workspace-dev-lw'
        )
        expect(name).toEqual('test-workspace-dev')
        expect(location).toEqual('eastus')
        expect(tags?.environment).toEqual('dev')
      })
  })
})

/* --- Tests for createTable method --- */

import { Table } from '@pulumi/azure-native/operationalinsights/index.js'
import { WorkspaceTableProps } from '../../src/index.js'

class TestConstructWithTable extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  workspace: Workspace
  table: Table

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.workspace = this.operationalInsightsManager.createWorkspace(
      `test-workspace-table-${this.props.stage}`,
      this,
      this.props.testWorkspace
    )
    this.table = this.operationalInsightsManager.createTable(`test-table-${this.props.stage}`, this, {
      tableName: 'test-log-table',
      workspaceName: this.workspace.name,
      resourceGroupName: 'test-rg-dev',
    } as WorkspaceTableProps)
  }
}

class TestStackWithTable extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithTable

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithTable(props.name, this.props)
  }
}

const stackWithTable = new TestStackWithTable('test-table-stack', testStackProps)

describe('TestOperationalInsightsConstruct - Resource Group Fallback', () => {
  test('createWorkspace throws when resourceGroupName is missing', () => {
    expect(() => {
      class NoRgOiConstruct extends CommonAzureConstruct {
        constructor(name: string, props: any) {
          super(name, props)
          this.operationalInsightsManager.createWorkspace('test-no-rg-ws', this, {
            workspaceName: 'test-no-rg-workspace',
          } as any)
        }
      }
      class NoRgOiStack extends CommonAzureStack {
        constructor(name: string, props: any) {
          super(name, { ...testStackProps, resourceGroupName: undefined })
          new NoRgOiConstruct(props.name, this.props)
        }
      }
      new NoRgOiStack('test-no-rg-oi-stack', testStackProps)
    }).toThrow('Resource group name undefined for test-no-rg-ws')
  })
})

describe('TestOperationalInsightsConstruct - createTable', () => {
  test('provisions workspace table as expected', () => {
    expect(stackWithTable.construct.table).toBeDefined()
    pulumi.all([stackWithTable.construct.table.id]).apply(([id]) => {
      expect(id).toBeDefined()
    })
  })

  test('throws when props are undefined', () => {
    expect(() => {
      stack.construct.operationalInsightsManager.createTable('test-table-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-table-err')
  })
})
