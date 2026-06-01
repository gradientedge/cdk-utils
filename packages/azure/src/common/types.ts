import { BaseProps } from '@gradientedge/cdk-utils-common'
import { GetComponentOutputArgs } from '@pulumi/azure-native/applicationinsights/index.js'
import { GetWorkspaceOutputArgs } from '@pulumi/azure-native/operationalinsights/index.js'
import { Input } from '@pulumi/pulumi'

import { AzureLocation, AzureRemoteBackend } from './constants.js'

/**
 * Configuration for an Azure location/region
 * @category Interface
 */
export interface AzureLocationConfig {
  /** Unique identifier for the location */
  id: string
  /** Display name of the location */
  name: string
}

/**
 * @interface CommonAzureStackProps
 * Common properties for Azure stack configuration using Pulumi
 */
/**
 * Common properties for Azure stack configuration using Pulumi
 * @category Interface
 */
export interface CommonAzureStackProps extends BaseProps {
  /** Optional runtime versions for node functions */
  runtimeVersion?: Input<string>
  /** Optional Pulumi stack name for cross-stack references */
  stackName?: string
  /** Optional Azure resource group name override */
  resourceGroupName?: string
  /** Remote backend configuration for Pulumi state storage */
  remoteBackend?: AzureRemoteBackendProps
  /** Global prefix applied to all resource names */
  globalPrefix?: string
  /** Global suffix applied to all resource names */
  globalSuffix?: string
  /** Prefix applied to individual resource names */
  resourcePrefix?: string
  /** Suffix applied to individual resource names */
  resourceSuffix?: string
  /** Per-resource naming options keyed by resource type identifier */
  resourceNameOptions?: { [key: string]: AzureResourceNameFormatterProps }
  /** Primary Azure region for resource deployment */
  location: AzureLocation
  /** Location configuration map for multi-region deployments */
  locationConfig?: Record<AzureLocation, AzureLocationConfig>
  /** List of supported locales for the deployment */
  locales?: string[]
  /** Default tags applied to all taggable Azure resources */
  defaultTags?: { [key: string]: string }
  /** Shared Log Analytics Workspace lookup arguments for diagnostic logging */
  commonLogAnalyticsWorkspace?: GetWorkspaceOutputArgs
  /** Shared Application Insights component lookup arguments for telemetry */
  commonApplicationInsights?: GetComponentOutputArgs

  // Azure Provider properties for Pulumi
  /** Azure subscription ID for the deployment */
  subscriptionId?: string
  /** Azure Active Directory tenant ID */
  tenantId?: string
  /** Service principal client ID for authentication */
  clientId?: string
  /** Service principal client secret for authentication */
  clientSecret?: string
  /** Azure cloud environment (e.g. 'public', 'usgovernment') */
  environment?: string
  /** Enable OpenID Connect (OIDC) authentication */
  useOidc?: boolean
  /** OIDC request token for federated identity */
  oidcRequestToken?: string
  /** OIDC request URL for federated identity */
  oidcRequestUrl?: string
  /** Enable Managed Service Identity (MSI) authentication */
  useMsi?: boolean
  /** Custom MSI endpoint URL */
  msiEndpoint?: string
}

/**
 * Properties for configuring Azure remote backend state storage
 * @category Interface
 */
export interface AzureRemoteBackendProps {
  /** The type of remote backend to use */
  type: AzureRemoteBackend
  /** Azure Storage Account name for state storage */
  storageAccountName?: string
  /** Azure Storage container name for state files */
  containerName?: string
  /** Resource group containing the storage account */
  resourceGroupName?: string
  /** Azure subscription ID for the backend storage account */
  subscriptionId?: string
  /** State file key/path within the container */
  key?: string
}

/**
 * Options to control the formatting of Azure resource names
 * @category Interface
 */
export interface AzureResourceNameFormatterProps {
  /** When true, excludes both prefix and suffix from the formatted name */
  exclude?: boolean
  /** When true, includes the global prefix from stack props */
  globalPrefix?: boolean
  /** When true, includes the global suffix from stack props */
  globalSuffix?: boolean
  /** Custom prefix for this specific resource name */
  prefix?: string
  /** Custom suffix for this specific resource name */
  suffix?: string
}
