import { readdirSync } from 'fs'
import path from 'path'

import * as command from '@pulumi/command/local/index.js'
import { LoadTest } from '@pulumi/azure-native/loadtestservice/index.js'
import { NatGateway, PublicIPAddress, Subnet, VirtualNetwork } from '@pulumi/azure-native/network/index.js'
import * as pulumi from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { AzureLoadTestingProps } from './types.js'

/**
 * Provides a construct to provision Azure Load Testing with its dedicated networking resources.
 * @example
 * import { AzureLoadTesting, AzureLoadTestingProps } from '@gradientedge/cdk-utils-azure'
 *
 * class CustomConstruct extends AzureLoadTesting {
 *   constructor(id: string, props: AzureLoadTestingProps) {
 *     super(id, props)
 *     this.props = props
 *     this.initResources()
 *   }
 * }
 * @category Construct
 */
export class AzureLoadTesting extends CommonAzureConstruct {
  /** Load testing construct properties */
  declare props: AzureLoadTestingProps
  /** Provisioned Azure Load Testing resource */
  loadTest: LoadTest
  /** Provisioned NAT gateway */
  natGateway: NatGateway
  /** Provisioned public IP address */
  publicIp: PublicIPAddress
  /** Provisioned subnet */
  subnet: Subnet
  /** Provisioned virtual network */
  virtualNetwork: VirtualNetwork

  /**
   * @summary Create a new AzureLoadTesting construct
   * @param id scoped id of the resource
   * @param props the load testing properties
   */
  constructor(id: string, props: AzureLoadTestingProps) {
    super(id, props)
    this.props = props
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createResourceGroup()
    this.createVirtualNetwork()
    this.createPublicIp()
    this.createNatGateway()
    this.createSubnet()
    this.createLoadTest()
    this.deployLoadTests()
  }

  /** @summary Create the virtual network for load testing */
  protected createVirtualNetwork() {
    this.virtualNetwork = this.networkingManager.createVirtualNetwork(`${this.id}`, this, {
      ...this.props.loadTestingVirtualNetwork,
      virtualNetworkName: this.props.loadTestingVirtualNetwork.virtualNetworkName ?? this.id,
      resourceGroupName: this.resourceGroup.name,
      location: this.resourceGroup.location,
    })
  }

  /** @summary Create the public IP used by the NAT gateway */
  protected createPublicIp() {
    this.publicIp = this.networkingManager.createPublicIPAddress(`${this.id}`, this, {
      ...this.props.loadTestingPublicIp,
      publicIpAddressName: this.props.loadTestingPublicIp.publicIpAddressName ?? this.id,
      resourceGroupName: this.resourceGroup.name,
      location: this.resourceGroup.location,
    })
  }

  /** @summary Create the NAT gateway for outbound load testing traffic */
  protected createNatGateway() {
    this.natGateway = this.networkingManager.createNatGateway(`${this.id}`, this, {
      ...this.props.loadTestingNatGateway,
      natGatewayName: this.props.loadTestingNatGateway.natGatewayName ?? this.id,
      resourceGroupName: this.resourceGroup.name,
      location: this.resourceGroup.location,
      publicIpAddresses: [{ id: this.publicIp.id }],
    })
  }

  /** @summary Create the subnet attached to the NAT gateway */
  protected createSubnet() {
    this.subnet = this.networkingManager.createSubnet(`${this.id}`, this, {
      ...this.props.loadTestingSubnet,
      subnetName: this.props.loadTestingSubnet.subnetName ?? this.id,
      resourceGroupName: this.resourceGroup.name,
      virtualNetworkName: this.virtualNetwork.name,
      natGateway: {
        id: this.natGateway.id,
      },
    })
  }

  /** @summary Create the Azure Load Testing resource */
  protected createLoadTest() {
    this.loadTest = this.loadTestManager.createLoadTest(`${this.id}`, this, {
      ...this.props.loadTest,
      resourceGroupName: this.resourceGroup.name,
      location: this.resourceGroup.location,
    })
  }

  /** @summary Create or update test definitions from YAML files in the configured directory */
  protected deployLoadTests() {
    const configDir = path.resolve(this.props.loadTestConfigPath)
    const yamlFiles = readdirSync(configDir).filter(file => file.endsWith('.yaml'))

    for (const configFile of yamlFiles) {
      const testId = configFile.replace('.yaml', '')
      const configPath = path.resolve(configDir, configFile)
      const loadTestCommand = pulumi
        .all([this.loadTest.name, this.resourceGroup.name, this.subnet.id])
        .apply(
          ([loadTestName, resourceGroupName, subnetId]) =>
            `az load test create --load-test-resource "${loadTestName}" --resource-group "${resourceGroupName}" --test-id "${testId}" --load-test-config-file "${configPath}" --subnet-id "${subnetId}" 2>&1 || az load test update --load-test-resource "${loadTestName}" --resource-group "${resourceGroupName}" --test-id "${testId}" --load-test-config-file "${configPath}" --subnet-id "${subnetId}"`
        )

      new command.Command(`${this.id}-deploy-${testId}`, {
        create: loadTestCommand,
        update: loadTestCommand,
        triggers: [this.loadTest.id, configFile],
      })
    }
  }
}
