import * as pulumi from '@pulumi/pulumi'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { applyTags, isTaggableResource, registerTagTransformation } from '../../src/common/tagging.js'

describe('isTaggableResource', () => {
  test('returns false for resources in exclusion list', () => {
    expect(isTaggableResource('azure-native:apimanagement:ApiManagementNamedValue')).toBe(false)
    expect(isTaggableResource('azure-native:authorization:Application')).toBe(false)
    expect(isTaggableResource('azure-native:authorization:ServicePrincipal')).toBe(false)
  })

  test('returns true for resources not in exclusion list', () => {
    expect(isTaggableResource('azure-native:resources:ResourceGroup')).toBe(true)
    expect(isTaggableResource('azure-native:storage:StorageAccount')).toBe(true)
    expect(isTaggableResource('azure-native:compute:VirtualMachine')).toBe(true)
  })

  test('handles resource types without colons', () => {
    expect(isTaggableResource('ResourceGroup')).toBe(true)
  })

  test('handles empty resource type', () => {
    expect(isTaggableResource('')).toBe(true)
  })
})

describe('applyTags', () => {
  test('merges default tags with existing tags', () => {
    const props = {
      name: 'test-resource',
      tags: {
        team: 'platform',
      },
    }

    const result = applyTags(props, {
      environment: 'production',
      project: 'test-project',
    })

    expect(result).toEqual({
      name: 'test-resource',
      tags: {
        environment: 'production',
        project: 'test-project',
        team: 'platform',
      },
    })
  })

  test('resource tags take precedence over default tags', () => {
    const props = {
      name: 'test-resource',
      tags: {
        environment: 'development',
      },
    }

    const result = applyTags(props, {
      environment: 'production',
      project: 'test-project',
    })

    expect(result).toEqual({
      name: 'test-resource',
      tags: {
        environment: 'development',
        project: 'test-project',
      },
    })
  })

  test('applies tags when resource has no existing tags', () => {
    const props: { name: string; tags?: Record<string, string> } = {
      name: 'test-resource',
    }

    const result = applyTags(props, {
      environment: 'production',
      team: 'platform',
    })

    expect(result).toEqual({
      name: 'test-resource',
      tags: {
        environment: 'production',
        team: 'platform',
      },
    })
  })

  test('preserves other properties', () => {
    const props = {
      name: 'test-resource',
      location: 'eastus',
      sku: 'Standard',
      tags: {
        existing: 'tag',
      },
    }

    const result = applyTags(props, {
      environment: 'production',
    })

    expect(result).toEqual({
      name: 'test-resource',
      location: 'eastus',
      sku: 'Standard',
      tags: {
        environment: 'production',
        existing: 'tag',
      },
    })
  })

  test('handles empty default tags', () => {
    const props = {
      name: 'test-resource',
      tags: {
        existing: 'tag',
      },
    }

    const result = applyTags(props, {})

    expect(result).toEqual({
      name: 'test-resource',
      tags: {
        existing: 'tag',
      },
    })
  })

  test('handles multiple tag keys', () => {
    const props = {
      name: 'test-resource',
      tags: {
        existing1: 'tag1',
        existing2: 'tag2',
      },
    }

    const result = applyTags(props, {
      new1: 'value1',
      new2: 'value2',
      new3: 'value3',
    })

    expect(result).toEqual({
      name: 'test-resource',
      tags: {
        new1: 'value1',
        new2: 'value2',
        new3: 'value3',
        existing1: 'tag1',
        existing2: 'tag2',
      },
    })
  })
})

describe('registerTagTransformation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('registers a stack transformation with default tags', () => {
    const registerSpy = vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation(() => {})
    registerTagTransformation({ environment: 'production', team: 'platform' })
    expect(registerSpy).toHaveBeenCalledOnce()
    expect(registerSpy).toHaveBeenCalledWith(expect.any(Function))
  })

  test('transformation merges default tags with resource tags for taggable resources', () => {
    let capturedTransformation: (args: pulumi.ResourceTransformationArgs) => any
    vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation((fn: any) => {
      capturedTransformation = fn
    })

    registerTagTransformation({ environment: 'production', team: 'platform' })

    const result = capturedTransformation!({
      type: 'azure-native:resources:ResourceGroup',
      name: 'test-rg',
      props: { tags: { app: 'myapp' } },
      opts: {},
      resource: {} as any,
    })

    expect(result).toBeDefined()
    expect(result!.props.tags).toEqual({
      environment: 'production',
      team: 'platform',
      app: 'myapp',
    })
  })

  test('transformation applies default tags when resource has no tags', () => {
    let capturedTransformation: (args: pulumi.ResourceTransformationArgs) => any
    vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation((fn: any) => {
      capturedTransformation = fn
    })

    registerTagTransformation({ environment: 'production' })

    const result = capturedTransformation!({
      type: 'azure-native:resources:ResourceGroup',
      name: 'test-rg',
      props: {},
      opts: {},
      resource: {} as any,
    })

    expect(result).toBeDefined()
    expect(result!.props.tags).toEqual({
      environment: 'production',
    })
  })

  test('resource tags take precedence over default tags', () => {
    let capturedTransformation: (args: pulumi.ResourceTransformationArgs) => any
    vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation((fn: any) => {
      capturedTransformation = fn
    })

    registerTagTransformation({ environment: 'production' })

    const result = capturedTransformation!({
      type: 'azure-native:resources:ResourceGroup',
      name: 'test-rg',
      props: { tags: { environment: 'staging' } },
      opts: {},
      resource: {} as any,
    })

    expect(result).toBeDefined()
    expect(result!.props.tags.environment).toEqual('staging')
  })

  test('transformation returns undefined for non-taggable resources', () => {
    let capturedTransformation: (args: pulumi.ResourceTransformationArgs) => any
    vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation((fn: any) => {
      capturedTransformation = fn
    })

    registerTagTransformation({ environment: 'production' })

    const result = capturedTransformation!({
      type: 'azure-native:apimanagement:ApiManagementNamedValue',
      name: 'test-nv',
      props: {},
      opts: {},
      resource: {} as any,
    })

    expect(result).toBeUndefined()
  })

  test('transformation returns undefined when props is null', () => {
    let capturedTransformation: (args: pulumi.ResourceTransformationArgs) => any
    vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation((fn: any) => {
      capturedTransformation = fn
    })

    registerTagTransformation({ environment: 'production' })

    const result = capturedTransformation!({
      type: 'azure-native:resources:ResourceGroup',
      name: 'test-rg',
      props: null as any,
      opts: {},
      resource: {} as any,
    })

    expect(result).toBeUndefined()
  })

  test('transformation handles tagsToIgnore parameter', () => {
    let capturedTransformation: (args: pulumi.ResourceTransformationArgs) => any
    vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation((fn: any) => {
      capturedTransformation = fn
    })

    registerTagTransformation({ environment: 'production' }, ['managedBy', 'createdAt'])

    const result = capturedTransformation!({
      type: 'azure-native:resources:ResourceGroup',
      name: 'test-rg',
      props: { tags: { app: 'myapp' } },
      opts: {},
      resource: {} as any,
    })

    expect(result).toBeDefined()
    expect(result!.opts.ignoreChanges).toEqual(['tags.managedBy', 'tags.createdAt'])
  })

  test('transformation merges tagsToIgnore with existing ignoreChanges', () => {
    let capturedTransformation: (args: pulumi.ResourceTransformationArgs) => any
    vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation((fn: any) => {
      capturedTransformation = fn
    })

    registerTagTransformation({ environment: 'production' }, ['managedBy'])

    const result = capturedTransformation!({
      type: 'azure-native:resources:ResourceGroup',
      name: 'test-rg',
      props: { tags: {} },
      opts: { ignoreChanges: ['location'] },
      resource: {} as any,
    })

    expect(result).toBeDefined()
    expect(result!.opts.ignoreChanges).toEqual(['location', 'tags.managedBy'])
  })

  test('transformation does not modify opts when tagsToIgnore is empty', () => {
    let capturedTransformation: (args: pulumi.ResourceTransformationArgs) => any
    vi.spyOn(pulumi.runtime, 'registerStackTransformation').mockImplementation((fn: any) => {
      capturedTransformation = fn
    })

    registerTagTransformation({ environment: 'production' }, [])

    const originalOpts = { parent: undefined }
    const result = capturedTransformation!({
      type: 'azure-native:resources:ResourceGroup',
      name: 'test-rg',
      props: {},
      opts: originalOpts,
      resource: {} as any,
    })

    expect(result).toBeDefined()
    expect(result!.opts).toBe(originalOpts)
  })
})
