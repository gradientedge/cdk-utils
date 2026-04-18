import { Deployment, DeploymentMode, Resource } from '@pulumi/azure-native/resources/index.js'
import { ClientCertMode, ManagedServiceIdentityType, WebApp, WebAppFunction } from '@pulumi/azure-native/web/index.js'
import { ResourceOptions } from '@pulumi/pulumi'
import { v5 as uuidv5 } from 'uuid'

import { CommonAzureConstruct, CommonAzureStack } from '../../common/index.js'

import { FunctionAppFlexConsumptionProps, FunctionAppProps, FunctionProps } from './types.js'

/**
 * Provides operations on Azure Functions using Pulumi
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```typescript
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     this.props = props
 *     this.functionManager.createFunctionApp('MyFunctionApp', this, props)
 *   }
 * }
 * ```
 * @category Service
 */
export class AzureFunctionManager {
  /**
   * @summary Method to create a new Linux function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props function app properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Function App]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
   */
  public createFunctionApp(
    id: string,
    scope: CommonAzureConstruct,
    props: FunctionAppProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    return new WebApp(
      `${id}-fa`,
      {
        ...props,
        name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.linuxFunctionApp),
        resourceGroupName,
        location: props.location ?? scope.props.location,
        kind: props.kind ?? 'functionapp,linux',
        identity: props.identity ?? {
          type: ManagedServiceIdentityType.SystemAssigned,
        },
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new function within a function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props function properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Function Envelope]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webappfunction/}
   * In Pulumi, individual functions are typically deployed via code deployment rather than as separate infrastructure resources.
   * This method is provided for API compatibility but may require additional setup.
   */
  public createFunction(
    id: string,
    scope: CommonAzureConstruct,
    props: FunctionProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    return new WebAppFunction(
      `${id}-fc`,
      {
        name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.functionAppFunction),
        resourceGroupName,
        functionAppId: props.functionAppId,
        config: props.configJson,
        isDisabled: props.enabled !== undefined ? !props.enabled : false,
        testData: props.testData,
      } as any,
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new flex consumption function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props flex consumption function app properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Function App (Flex Consumption)]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
   */
  public createFunctionAppFlexConsumption(
    id: string,
    scope: CommonAzureConstruct,
    props: FunctionAppFlexConsumptionProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
    const name = scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.functionApp)
    const location = props.location ?? scope.props.location
    const runtime = {
      ...props.runtime,
      name: props.runtime?.name ?? 'node',
      version: props.runtime?.version ?? CommonAzureStack.NODEJS_RUNTIME,
    }
    const scaleAndConcurrency = {
      ...props.scaleAndConcurrency,
      instanceMemoryMB: props.scaleAndConcurrency?.instanceMemoryMB ?? 4096,
      maximumInstanceCount: props.scaleAndConcurrency?.maximumInstanceCount ?? 40,
    }

    const functionApp = new WebApp(
      `${id}-fc`,
      {
        ...props,
        name,
        location,
        resourceGroupName,
        kind: props.kind ?? 'functionapp,linux',
        reserved: props.reserved ?? true,
        httpsOnly: props.httpsOnly ?? true,
        identity: props.identity ?? {
          type: ManagedServiceIdentityType.SystemAssigned,
        },
        clientAffinityEnabled: props.clientAffinityEnabled ?? false,
        clientAffinityProxyEnabled: props.clientAffinityProxyEnabled ?? false,
        clientCertMode: props.clientCertMode ?? ClientCertMode.Optional,
        clientCertEnabled: props.clientCertEnabled ?? false,
        functionAppConfig: {
          ...props.functionAppConfig,
          runtime,
          scaleAndConcurrency,
        },
        siteConfig: props.siteConfig ?? {
          http20Enabled: true,
          linuxFxVersion: `${props.runtime?.name ?? 'node'}|${props.runtime?.version ?? CommonAzureStack.NODEJS_RUNTIME}`,
        },
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )

    // perform a deployment for the rolling update strategy
    const deploymentId = uuidv5(`${id}-depl`, uuidv5.DNS)
    new Deployment(
      deploymentId,
      {
        deploymentName: deploymentId,
        resourceGroupName,
        properties: {
          mode: DeploymentMode.Incremental,
          template: {
            $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
            contentVersion: '1.0.0.0',
            resources: [
              {
                type: 'Microsoft.Web/sites',
                apiVersion: '2024-04-01',
                name,
                location,
                properties: {
                  functionAppConfig: {
                    ...props.functionAppConfig,
                    runtime,
                    scaleAndConcurrency,
                    siteUpdateStrategy: {
                      type: 'RollingUpdate',
                    },
                  },
                },
              },
            ],
          },
        },
      },
      { parent: functionApp, ...resourceOptions }
    )

    return functionApp
  }

  /**
   * @summary Method to create a new flex consumption function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props flex consumption function app properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Function App (Flex Consumption)]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
   */
  public createFunctionAppFlexConsumptionResource(
    id: string,
    scope: CommonAzureConstruct,
    props: FunctionAppFlexConsumptionProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    return new Resource(
      `${id}-fc`,
      {
        apiVersion: '2024-04-01',
        identity: {
          type: ManagedServiceIdentityType.SystemAssigned,
        },
        kind: props.kind ?? 'functionapp,linux',
        location: props.location ?? scope.props.location,
        parentResourcePath: '',
        properties: {
          httpsOnly: props.httpsOnly ?? true,
          serverFarmId: props.serverFarmId,
          siteConfig: props.siteConfig,
          functionAppConfig: {
            ...props.functionAppConfig,
            runtime: {
              ...props.runtime,
              name: props.runtime?.name ?? 'node',
              version: props.runtime?.version ?? CommonAzureStack.NODEJS_RUNTIME,
            },
            scaleAndConcurrency: {
              ...props.scaleAndConcurrency,
              instanceMemoryMB: props.scaleAndConcurrency?.instanceMemoryMB ?? 4096,
              maximumInstanceCount: props.scaleAndConcurrency?.maximumInstanceCount ?? 40,
            },
            siteUpdateStrategy: {
              type: 'RollingUpdate',
            },
          },
        },
        resourceGroupName,
        resourceName: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.functionApp),
        resourceProviderNamespace: 'Microsoft.Web',
        resourceType: 'sites',
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
