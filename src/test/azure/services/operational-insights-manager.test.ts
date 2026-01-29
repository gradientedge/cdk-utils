import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  WorkspaceProps,
} from '../../../lib/azure/index.js'
import { Workspace } from '@pulumi/azure-native/operationalinsights/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testWorkspace: WorkspaceProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/workspace.json'],
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
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:operationalinsights:Workspace::test-workspace-dev-lw'
        )
        expect(name).toEqual('test-workspace-dev')
        expect(location).toEqual('eastus')
        expect(tags?.environment).toEqual('dev')
      })
  })
})
