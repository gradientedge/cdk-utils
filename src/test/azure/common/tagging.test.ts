import { describe, expect, test } from 'vitest'
import { applyTags, isTaggableResource } from '../../../lib/azure/common/tagging.js'

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
