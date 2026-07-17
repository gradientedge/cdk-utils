import { LoadTest } from '@pulumi/azure-native/loadtestservice/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { LoadTestProps } from './types.js'

/**
 * Provides operations on Azure Load Testing using Pulumi.
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
 *     this.loadTestManager.createLoadTest('MyLoadTest', this, props)
 *   }
 * }
 * ```
 * @category Service
 */
export class AzureLoadTestManager {
  /**
   * @summary Method to create a new Azure Load Testing resource
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props load test properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Load Test]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/loadtestservice/loadtest/}
   */
  public createLoadTest(
    id: string,
    scope: CommonAzureConstruct,
    props: LoadTestProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroupName = props.resourceGroupName ?? scope.resourceGroup.name

    return new LoadTest(
      `${id}-lt`,
      {
        ...props,
        loadTestName: scope.resourceNameFormatter.format(
          props.loadTestName?.toString(),
          scope.props.resourceNameOptions?.loadTest
        ),
        resourceGroupName,
        location: props.location ?? scope.props.location,
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
