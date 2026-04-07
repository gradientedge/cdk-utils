import * as cdk from 'aws-cdk-lib'
import { CustomResource } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { findOneResourceId, ref, importValue } from '../../../tools/cdk/resources.js'

const app = new cdk.App()
const stack = new cdk.Stack(app, 'test-resources-stack')

new CustomResource(stack, 'TestResource', {
  resourceType: 'Custom::TestResource',
  serviceToken: 'dummy-service-token',
})

new CustomResource(stack, 'TestDuplicateResource1', {
  resourceType: 'Custom::DuplicateResource',
  serviceToken: 'dummy-service-token-1',
})

new CustomResource(stack, 'TestDuplicateResource2', {
  resourceType: 'Custom::DuplicateResource',
  serviceToken: 'dummy-service-token-2',
})

const template = Template.fromStack(stack)

describe('findOneResourceId', () => {
  test('returns resource id when exactly one resource found', () => {
    const resourceId = findOneResourceId(template, 'Custom::TestResource')
    expect(resourceId).toBeDefined()
    expect(typeof resourceId).toBe('string')
  })

  test('throws error when resource not found', () => {
    expect(() => findOneResourceId(template, 'Custom::NonExistent')).toThrow('Resource Custom::NonExistent not found')
  })

  test('throws error when multiple resources found', () => {
    expect(() => findOneResourceId(template, 'Custom::DuplicateResource')).toThrow(
      'Multiple resources with name Custom::DuplicateResource found'
    )
  })
})

describe('ref', () => {
  test('wraps value in Ref', () => {
    expect(ref('TestValue')).toEqual({ Ref: 'TestValue' })
  })
})

describe('importValue', () => {
  test('wraps value in Fn::ImportValue', () => {
    expect(importValue('TestValue')).toEqual({ 'Fn::ImportValue': 'TestValue' })
  })
})
