import { NatGateway, PublicIPAddress, Subnet, VirtualNetwork } from '@pulumi/azure-native/network/index.js'
import * as pulumi from '@pulumi/pulumi'
import { outputToPromise } from '../helpers.js'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  NatGatewayProps,
  PublicIPAddressProps,
  SubnetProps,
  VirtualNetworkProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testVirtualNetwork: VirtualNetworkProps
  testPublicIPAddress: PublicIPAddressProps
  testNatGateway: NatGatewayProps
  testSubnet: SubnetProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/networking.json'],
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

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  virtualNetwork: VirtualNetwork
  publicIPAddress: PublicIPAddress
  natGateway: NatGateway
  subnet: Subnet

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.virtualNetwork = this.networkingManager.createVirtualNetwork(
      `test-virtual-network-${this.props.stage}`,
      this,
      { ...this.props.testVirtualNetwork, resourceGroupName: testStackProps.resourceGroupName }
    )
    this.publicIPAddress = this.networkingManager.createPublicIPAddress(`test-public-ip-${this.props.stage}`, this, {
      ...this.props.testPublicIPAddress,
      resourceGroupName: testStackProps.resourceGroupName,
    })
    this.natGateway = this.networkingManager.createNatGateway(`test-nat-gateway-${this.props.stage}`, this, {
      ...this.props.testNatGateway,
      resourceGroupName: testStackProps.resourceGroupName,
    })
    this.subnet = this.networkingManager.createSubnet(`test-subnet-${this.props.stage}`, this, {
      ...this.props.testSubnet,
      resourceGroupName: testStackProps.resourceGroupName,
      virtualNetworkName: this.virtualNetwork.name,
    })
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

    // Return different names based on resource type
    if (args.type === 'azure-native:network:VirtualNetwork') {
      name = args.inputs.virtualNetworkName
    } else if (args.type === 'azure-native:network:PublicIPAddress') {
      name = args.inputs.publicIpAddressName
    } else if (args.type === 'azure-native:network:NatGateway') {
      name = args.inputs.natGatewayName
    } else if (args.type === 'azure-native:network:Subnet') {
      name = args.inputs.subnetName
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

describe('TestAzureNetworkingConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureNetworkingConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.virtualNetwork).toBeDefined()
    expect(stack.construct.publicIPAddress).toBeDefined()
    expect(stack.construct.natGateway).toBeDefined()
    expect(stack.construct.subnet).toBeDefined()
  })
})

describe('TestAzureNetworkingConstruct', () => {
  test('provisions virtual network as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.virtualNetwork.id,
          stack.construct.virtualNetwork.urn,
          stack.construct.virtualNetwork.name,
          stack.construct.virtualNetwork.location,
          stack.construct.virtualNetwork.tags,
        ])
        .apply(([id, urn, name, location, tags]) => {
          expect(id).toEqual('test-virtual-network-dev-vnet-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack\$azure-native:network:VirtualNetwork::test-virtual-network-dev-vnet'
          )
          expect(name).toEqual('testvnet-dev')
          expect(location).toEqual('eastus')
          expect(tags).toHaveProperty('environment', 'dev')
        })
    )
  })
})

describe('TestAzureNetworkingConstruct', () => {
  test('provisions public IP address as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.publicIPAddress.id,
          stack.construct.publicIPAddress.urn,
          stack.construct.publicIPAddress.name,
          stack.construct.publicIPAddress.location,
          stack.construct.publicIPAddress.tags,
        ])
        .apply(([id, urn, name, location, tags]) => {
          expect(id).toEqual('test-public-ip-dev-pip-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack\$azure-native:network:PublicIPAddress::test-public-ip-dev-pip'
          )
          expect(name).toEqual('testpip-dev')
          expect(location).toEqual('eastus')
          expect(tags).toHaveProperty('environment', 'dev')
        })
    )
  })
})

describe('TestAzureNetworkingConstruct', () => {
  test('provisions NAT gateway as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.natGateway.id,
          stack.construct.natGateway.urn,
          stack.construct.natGateway.name,
          stack.construct.natGateway.location,
          stack.construct.natGateway.tags,
        ])
        .apply(([id, urn, name, location, tags]) => {
          expect(id).toEqual('test-nat-gateway-dev-ngw-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack\$azure-native:network:NatGateway::test-nat-gateway-dev-ngw'
          )
          expect(name).toEqual('testngw-dev')
          expect(location).toEqual('eastus')
          expect(tags).toHaveProperty('environment', 'dev')
        })
    )
  })
})

describe('TestAzureNetworkingConstruct', () => {
  test('provisions subnet as expected', async () => {
    await outputToPromise(
      pulumi
        .all([stack.construct.subnet.id, stack.construct.subnet.urn, stack.construct.subnet.name])
        .apply(([id, urn, name]) => {
          expect(id).toEqual('test-subnet-dev-subnet-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack\$azure-native:network:Subnet::test-subnet-dev-subnet'
          )
          expect(name).toEqual('testsubnet-dev')
        })
    )
  })
})

/* --- Tests for default value fallback branches --- */

class TestMinimalNetworkingConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  virtualNetwork: VirtualNetwork
  publicIPAddress: PublicIPAddress
  natGateway: NatGateway

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    // Explicit location - covers truthy branch of props.location ?? scope.props.location
    this.virtualNetwork = this.networkingManager.createVirtualNetwork(`test-minimal-vnet-${this.props.stage}`, this, {
      virtualNetworkName: 'minimalvnet',
      resourceGroupName: testStackProps.resourceGroupName,
      location: 'westus',
      addressSpace: { addressPrefixes: ['10.2.0.0/16'] },
    })
    // No sku.tier - covers sku?.tier ?? 'Regional' fallback; explicit publicIPAddressVersion
    this.publicIPAddress = this.networkingManager.createPublicIPAddress(`test-minimal-pip-${this.props.stage}`, this, {
      publicIpAddressName: 'minimalpip',
      resourceGroupName: testStackProps.resourceGroupName,
      location: 'westus',
      publicIPAllocationMethod: 'Static',
      publicIPAddressVersion: 'IPv4',
      sku: { name: 'Standard' },
    })
    // Explicit location - covers NAT gateway location truthy branch
    this.natGateway = this.networkingManager.createNatGateway(`test-minimal-ngw-${this.props.stage}`, this, {
      natGatewayName: 'minimalngw',
      resourceGroupName: testStackProps.resourceGroupName,
      location: 'westus',
      sku: { name: 'Standard' },
      idleTimeoutInMinutes: 4,
    })
  }
}

class TestMinimalNetworkingStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestMinimalNetworkingConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalNetworkingConstruct(props.name, this.props)
  }
}

const minimalNetworkingStack = new TestMinimalNetworkingStack('test-minimal-networking-stack', testStackProps)

describe('TestAzureNetworkingConstruct - Default Values', () => {
  test('virtual network uses explicit location when provided', async () => {
    await outputToPromise(
      pulumi.all([minimalNetworkingStack.construct.virtualNetwork.location]).apply(([location]) => {
        expect(location).toEqual('westus')
      })
    )
  })

  test('public IP address uses explicit location and version when provided', async () => {
    await outputToPromise(
      pulumi
        .all([
          minimalNetworkingStack.construct.publicIPAddress.location,
          minimalNetworkingStack.construct.publicIPAddress.publicIPAddressVersion,
        ])
        .apply(([location, version]) => {
          expect(location).toEqual('westus')
          expect(version).toEqual('IPv4')
        })
    )
  })

  test('NAT gateway uses explicit location when provided', async () => {
    await outputToPromise(
      pulumi.all([minimalNetworkingStack.construct.natGateway.location]).apply(([location]) => {
        expect(location).toEqual('westus')
      })
    )
  })
})

describe('TestAzureNetworkingConstruct - Props Undefined Error Handling', () => {
  test('createVirtualNetwork throws when props are undefined', () => {
    expect(() => {
      minimalNetworkingStack.construct.networkingManager.createVirtualNetwork(
        'test-vnet-err',
        minimalNetworkingStack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-vnet-err')
  })

  test('createPublicIPAddress throws when props are undefined', () => {
    expect(() => {
      minimalNetworkingStack.construct.networkingManager.createPublicIPAddress(
        'test-pip-err',
        minimalNetworkingStack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-pip-err')
  })

  test('createNatGateway throws when props are undefined', () => {
    expect(() => {
      minimalNetworkingStack.construct.networkingManager.createNatGateway(
        'test-ngw-err',
        minimalNetworkingStack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-ngw-err')
  })

  test('createSubnet throws when props are undefined', () => {
    expect(() => {
      minimalNetworkingStack.construct.networkingManager.createSubnet(
        'test-subnet-err',
        minimalNetworkingStack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-subnet-err')
  })
})
