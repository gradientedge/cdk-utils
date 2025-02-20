import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import {
  DataAzurermApiManagement,
  DataAzurermApiManagementConfig,
} from '@cdktf/provider-azurerm/lib/data-azurerm-api-management'
import { ApiManagementBackend } from '@cdktf/provider-azurerm/lib/api-management-backend'
import { ApiManagement } from '@cdktf/provider-azurerm/lib/api-management'
import { ApiManagementApi } from '@cdktf/provider-azurerm/lib/api-management-api'
import { ApiManagementApiOperation } from '@cdktf/provider-azurerm/lib/api-management-api-operation'
import { ApiManagementApiOperationPolicy } from '@cdktf/provider-azurerm/lib/api-management-api-operation-policy'
import {
  ApiManagementLogger,
  ApiManagementLoggerApplicationInsights,
} from '@cdktf/provider-azurerm/lib/api-management-logger'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { ApiManagementProps, ApiManagementBackendProps, ApiManagementApiProps } from './types'
import _ from 'lodash'

/**
 * @classdesc Provides operations on Azure Api Management
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.apiManagementManager.createApiManagement('MyApiManagement', this, props)
 *   }
 * }
 * ```
 */
export class AzureApiManagementManager {
  /**
   * @summary Method to create a new api management
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management properties
   * @see [CDKTF Api management Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/apiManagement.typescript.md}
   */
  public createApiManagement(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiManagementProps,
    applicationInsightsKey?: ApiManagementLoggerApplicationInsights['instrumentationKey']
  ) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-am-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const apiManagement = new ApiManagement(scope, `${id}-am`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    if (applicationInsightsKey) {
      new ApiManagementLogger(scope, `${id}-am-logger`, {
        name: `${props.name}-${scope.props.stage}`,
        resourceGroupName: resourceGroup.name,
        apiManagementName: apiManagement.name,
        applicationInsights: {
          instrumentationKey: applicationInsightsKey,
        },
      })
    }

    createAzureTfOutput(`${id}-apiManagementName`, scope, apiManagement.name)
    createAzureTfOutput(`${id}-apiManagementFriendlyUniqueId`, scope, apiManagement.friendlyUniqueId)
    createAzureTfOutput(`${id}-apiManagementId`, scope, apiManagement.id)

    return apiManagement
  }

  /**
   * @summary Method to resolve an api management
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management properties
   * @see [CDKTF Api management Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/apiManagement.typescript.md}
   */
  public resolveApiManagement(id: string, scope: CommonAzureConstruct, props: DataAzurermApiManagementConfig) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-am-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const apiManagement = new DataAzurermApiManagement(scope, `${id}-am`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      resourceGroupName: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    return apiManagement
  }

  /**
   * @summary Method to create a new api management backend
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management backend properties
   * @see [CDKTF Api management Backend Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/ApiManagementBackend.typescript.md}
   */
  public createApiManagementBackend(id: string, scope: CommonAzureConstruct, props: ApiManagementBackendProps) {
    if (!props) throw `Props undefined for ${id}`

    const apiManagementBackend = new ApiManagementBackend(scope, `${id}-am-be`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      description: props.description || `Backend for ${props.name}-${scope.props.stage}`,
      protocol: props.protocol || 'http',
    })

    createAzureTfOutput(`${id}-apiManagementBackendName`, scope, apiManagementBackend.name)
    createAzureTfOutput(`${id}-apiManagementBackendFriendlyUniqueId`, scope, apiManagementBackend.friendlyUniqueId)
    createAzureTfOutput(`${id}-apiManagementBackendId`, scope, apiManagementBackend.id)

    return apiManagementBackend
  }

  /**
   * @summary Method to create a new api management api
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management api properties
   * @see [CDKTF Api management Api Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/ApiManagementApi.typescript.md}
   */
  public createApiManagementApi(id: string, scope: CommonAzureConstruct, props: ApiManagementApiProps) {
    if (!props) throw `Props undefined for ${id}`

    const apiManagementApi = new ApiManagementApi(scope, `${id}-am-api`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      displayName: props.displayName || props.name,
      revision: props.revision || '1',
      protocols: props.protocols || ['https'],
    })

    createAzureTfOutput(`${id}-apiManagementApiName`, scope, apiManagementApi.name)
    createAzureTfOutput(`${id}-apiManagementApiFriendlyUniqueId`, scope, apiManagementApi.friendlyUniqueId)
    createAzureTfOutput(`${id}-apiManagementApiId`, scope, apiManagementApi.id)

    _.forEach(props.operations, operation => {
      const apimOperation = new ApiManagementApiOperation(
        scope,
        `${id}-apim-api-operation-${operation.displayName}-${operation.method}`,
        {
          operationId: `${operation.displayName}-${operation.method}`,
          method: operation.method.toUpperCase(),
          apiManagementName: apiManagementApi.apiManagementName,
          resourceGroupName: apiManagementApi.resourceGroupName,
          apiName: apiManagementApi.name,
          displayName: operation.displayName,
          urlTemplate: operation.urlTemplate,
          templateParameter: operation.templateParameter
        }
      )

      createAzureTfOutput(
        `${id}-${operation.displayName}-${operation.method}-apimOperationOperationId`,
        scope,
        apimOperation.operationId
      )
      createAzureTfOutput(
        `${id}-${operation.displayName}-${operation.method}-apimOperationFriendlyUniqueId`,
        scope,
        apimOperation.friendlyUniqueId
      )
      createAzureTfOutput(`${id}-${operation.displayName}-${operation.method}-apimOperationId`, scope, apimOperation.id)

      if (props.policyXmlContent) {
        const apimOperationPolicy = new ApiManagementApiOperationPolicy(
          scope,
          `${id}-apim-api-operation-policy-${operation.displayName}-${operation.method}`,
          {
            apiManagementName: apiManagementApi.apiManagementName,
            resourceGroupName: apiManagementApi.resourceGroupName,
            apiName: apiManagementApi.name,
            operationId: apimOperation.operationId,
            xmlContent: props.policyXmlContent,
          }
        )

        createAzureTfOutput(
          `${id}-${operation.displayName}-${operation.method}-apimOperationPolicyFriendlyUniqueId`,
          scope,
          apimOperationPolicy.friendlyUniqueId
        )
        createAzureTfOutput(
          `${id}-${operation.displayName}-${operation.method}-apimOperationPolicyId`,
          scope,
          apimOperationPolicy.id
        )
      }
    })

    return apiManagementApi
  }
}
