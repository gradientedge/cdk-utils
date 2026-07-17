import * as pulumi from '@pulumi/pulumi'
import { outputToPromise } from '../helpers.js'
import {
  AzureLoadTesting,
  AzureLoadTestingProps,
  AzureLocation,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/load-testing.json',
  ],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

const testStackPropsMinimal: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/load-testing-minimal.json',
  ],
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: any
  declare construct: TestLoadTestingConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestLoadTestingConstruct(props.name, this.props)
  }
}

class TestLoadTestingConstruct extends AzureLoadTesting {
  declare props: AzureLoadTestingProps & TestAzureStackProps

  constructor(name: string, props: AzureLoadTestingProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.initResources()
  }
}

class TestCommonStackMinimal extends CommonAzureStack {
  declare props: any
  declare construct: TestLoadTestingMinimalConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackPropsMinimal)
    this.construct = new TestLoadTestingMinimalConstruct(`${props.name}-minimal`, this.props)
  }
}

class TestLoadTestingMinimalConstruct extends AzureLoadTesting {
  declare props: AzureLoadTestingProps & TestAzureStackProps

  constructor(name: string, props: AzureLoadTestingProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.initResources()
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath ?? '',
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    if (args.type === 'azure-native:resources:ResourceGroup') {
      name = args.inputs.resourceGroupName
    } else if (args.type === 'azure-native:network:VirtualNetwork') {
      name = args.inputs.virtualNetworkName
    } else if (args.type === 'azure-native:network:PublicIPAddress') {
      name = args.inputs.publicIpAddressName
    } else if (args.type === 'azure-native:network:NatGateway') {
      name = args.inputs.natGatewayName
    } else if (args.type === 'azure-native:network:Subnet') {
      name = args.inputs.subnetName
    } else if (args.type === 'azure-native:loadtestservice:LoadTest') {
      name = args.inputs.loadTestName
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name: name ?? args.name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsMinimal.extraContexts))
const stackMinimal = new TestCommonStackMinimal('test-minimal-stack', testStackPropsMinimal)

describe('TestAzureLoadTestingConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })

  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.virtualNetwork).toBeDefined()
    expect(stack.construct.publicIp).toBeDefined()
    expect(stack.construct.natGateway).toBeDefined()
    expect(stack.construct.subnet).toBeDefined()
    expect(stack.construct.loadTest).toBeDefined()
  })

  test('provisions virtual network as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.virtualNetwork.id,
          stack.construct.virtualNetwork.urn,
          stack.construct.virtualNetwork.name,
          stack.construct.virtualNetwork.tags,
        ])
        .apply(([id, urn, name, tags]) => {
          expect(id).toEqual('test-common-stack-vnet-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:network:VirtualNetwork::test-common-stack-vnet'
          )
          expect(name).toEqual('testvnet-dev')
          expect(tags).toHaveProperty('environment', 'dev')
        })
    )
  })

  test('provisions public IP address as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.publicIp.id,
          stack.construct.publicIp.urn,
          stack.construct.publicIp.name,
          stack.construct.publicIp.tags,
        ])
        .apply(([id, urn, name, tags]) => {
          expect(id).toEqual('test-common-stack-pip-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:network:PublicIPAddress::test-common-stack-pip'
          )
          expect(name).toEqual('testpip-dev')
          expect(tags).toHaveProperty('environment', 'dev')
        })
    )
  })

  test('provisions NAT gateway as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.natGateway.id,
          stack.construct.natGateway.urn,
          stack.construct.natGateway.name,
          stack.construct.natGateway.tags,
        ])
        .apply(([id, urn, name, tags]) => {
          expect(id).toEqual('test-common-stack-ngw-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:network:NatGateway::test-common-stack-ngw'
          )
          expect(name).toEqual('testngw-dev')
          expect(tags).toHaveProperty('environment', 'dev')
        })
    )
  })

  test('provisions subnet as expected', async () => {
    await outputToPromise(
      pulumi
        .all([stack.construct.subnet.id, stack.construct.subnet.urn, stack.construct.subnet.name])
        .apply(([id, urn, name]) => {
          expect(id).toEqual('test-common-stack-subnet-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:network:Subnet::test-common-stack-subnet'
          )
          expect(name).toEqual('testsubnet-dev')
        })
    )
  })

  test('provisions load test resource as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.loadTest.id,
          stack.construct.loadTest.urn,
          stack.construct.loadTest.name,
          stack.construct.loadTest.tags,
        ])
        .apply(([id, urn, name, tags]) => {
          expect(id).toEqual('test-common-stack-lt-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:loadtestservice:LoadTest::test-common-stack-lt'
          )
          expect(name).toEqual('testlt-dev')
          expect(tags).toHaveProperty('environment', 'dev')
        })
    )
  })
})

describe('TestAzureLoadTestingMinimalConstruct', () => {
  test('synthesises minimal construct as expected', () => {
    expect(stackMinimal).toBeDefined()
    expect(stackMinimal.construct).toBeDefined()
    expect(stackMinimal.construct.virtualNetwork).toBeDefined()
    expect(stackMinimal.construct.publicIp).toBeDefined()
    expect(stackMinimal.construct.natGateway).toBeDefined()
    expect(stackMinimal.construct.subnet).toBeDefined()
    expect(stackMinimal.construct.loadTest).toBeDefined()
  })

  test('provisions virtual network using construct id as name when not specified', async () => {
    await outputToPromise(
      pulumi
        .all([stackMinimal.construct.virtualNetwork.id, stackMinimal.construct.virtualNetwork.name])
        .apply(([id, name]) => {
          expect(id).toEqual('test-common-stack-minimal-vnet-id')
          expect(name).toEqual('test-common-stack-minimal-dev')
        })
    )
  })

  test('provisions public IP using construct id as name when not specified', async () => {
    await outputToPromise(
      pulumi.all([stackMinimal.construct.publicIp.id, stackMinimal.construct.publicIp.name]).apply(([id, name]) => {
        expect(id).toEqual('test-common-stack-minimal-pip-id')
        expect(name).toEqual('test-common-stack-minimal-dev')
      })
    )
  })

  test('provisions NAT gateway using construct id as name when not specified', async () => {
    await outputToPromise(
      pulumi.all([stackMinimal.construct.natGateway.id, stackMinimal.construct.natGateway.name]).apply(([id, name]) => {
        expect(id).toEqual('test-common-stack-minimal-ngw-id')
        expect(name).toEqual('test-common-stack-minimal-dev')
      })
    )
  })

  test('provisions subnet using construct id as name when not specified', async () => {
    await outputToPromise(
      pulumi.all([stackMinimal.construct.subnet.id, stackMinimal.construct.subnet.name]).apply(([id, name]) => {
        expect(id).toEqual('test-common-stack-minimal-subnet-id')
        expect(name).toEqual('test-common-stack-minimal-dev')
      })
    )
  })
})
