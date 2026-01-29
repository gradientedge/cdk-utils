import * as pulumi from '@pulumi/pulumi'
import { RESOURCES_TO_EXCLUDE_TAGS } from './constants.js'

/**
 * @summary Check if a resource type is taggable
 * @param resourceType The Pulumi resource type (e.g., 'azure-native:resources:ResourceGroup')
 * @returns True if the resource supports tags, false otherwise
 */
export function isTaggableResource(resourceType: string): boolean {
  // Extract the resource name from the type (e.g., 'ResourceGroup' from 'azure-native:resources:ResourceGroup')
  const resourceName = resourceType.split(':').pop() || ''

  // Check if this resource is in the exclusion list
  if (RESOURCES_TO_EXCLUDE_TAGS.has(resourceName)) {
    return false
  }

  // Most Azure resources support tags, but we can add more specific checks here if needed
  return true
}

/**
 * @summary Register a stack transformation to automatically apply tags to Azure resources
 * @param defaultTags The default tags to apply to all resources
 * @param tagsToIgnore Optional list of tag keys to ignore in lifecycle management
 * @example
 * ```typescript
 * registerTagTransformation({ environment: 'production', team: 'platform' })
 * ```
 */
export function registerTagTransformation(defaultTags: Record<string, string>, tagsToIgnore: string[] = []): void {
  pulumi.runtime.registerStackTransformation((args: pulumi.ResourceTransformationArgs) => {
    // Only process taggable resources
    if (!isTaggableResource(args.type)) {
      return undefined
    }

    // Check if the resource has a tags property
    if (!args.props || typeof args.props !== 'object') {
      return undefined
    }

    // Merge default tags with resource-specific tags (resource tags take precedence)
    const currentTags = (args.props as any).tags || {}
    const mergedTags = { ...defaultTags, ...currentTags }

    // Apply the merged tags
    const newProps = {
      ...args.props,
      tags: mergedTags,
    }

    // Handle tag ignores via Pulumi's ignoreChanges option
    let newOpts = args.opts
    if (tagsToIgnore.length > 0) {
      const ignoreChanges = tagsToIgnore.map(tag => `tags.${tag}`)
      newOpts = {
        ...args.opts,
        ignoreChanges: [...(args.opts?.ignoreChanges || []), ...ignoreChanges],
      }
    }

    return {
      props: newProps,
      opts: newOpts,
    }
  })
}

/**
 * @summary Helper function to apply tags to a specific resource's properties
 * @param props The resource properties
 * @param defaultTags The default tags to merge with existing tags
 * @returns The properties with merged tags
 * @example
 * ```typescript
 * const resourceGroupProps = applyTags(props, { environment: 'dev' })
 * ```
 */
export function applyTags<T extends { tags?: Record<string, string> }>(
  props: T,
  defaultTags: Record<string, string>
): T {
  return {
    ...props,
    tags: {
      ...defaultTags,
      ...(props.tags || {}),
    },
  }
}
