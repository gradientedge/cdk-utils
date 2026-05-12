import { input } from '@pulumi/azure-native/types/index.js'
import { WebAppArgs, WebAppFunctionArgs } from '@pulumi/azure-native/web/index.js'

/**
 * Properties for creating an Azure Function App
 * @see [Pulumi Azure Native Function App]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
 * @category Interface
 */
export interface FunctionAppProps extends WebAppArgs {
  /** Optional display name for the function app */
  name?: string
}

/**
 * Properties for creating an individual function within a Function App
 * @see [Pulumi Azure Native Function Envelope]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webappfunction/}
 * @category Interface
 */
export interface FunctionProps extends WebAppFunctionArgs {
  /** Function name */
  name: string
  /** The resource ID of the parent function app */
  functionAppId: string
  /** Programming language of the function */
  language?: string
  /** Function configuration JSON (bindings, etc.) */
  configJson?: any
  /** Test data for the function */
  testData?: string
  /** Whether the function is enabled */
  enabled?: boolean
}

/**
 * Properties for creating an Azure Function App with Flex Consumption hosting
 * @see [Pulumi Azure Native Function App (Flex Consumption)]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
 * @category Interface
 */
export interface FunctionAppFlexConsumptionProps extends WebAppArgs {
  /** Optional display name for the function app */
  name?: string
  /** Runtime configuration (language and version) */
  runtime?: input.web.FunctionsRuntimeArgs
  /** Scale and concurrency configuration (instance memory, max instances) */
  scaleAndConcurrency?: input.web.FunctionsScaleAndConcurrencyArgs
  /** Storage authentication type for deployment storage */
  storageAuthenticationType?: string
  /** Storage container type for deployment storage */
  storageContainerType?: string
}
