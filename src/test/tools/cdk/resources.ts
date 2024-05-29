import { Template } from 'aws-cdk-lib/assertions'

/**
 * Finds the resource id of a resource with the given name.
 */
const findOneResourceId = (template: Template, name: string): string => {
  const resources = template.findResources(name)
  if (Object.keys(resources).length === 0) {
    throw new Error(`Resource ${name} not found`)
  } else if (Object.keys(resources).length > 1) {
    throw new Error(`Multiple resources with name ${name} found`)
  }
  return Object.keys(resources)[0]
}

/**
 * Wraps value in the Ref CloudFormation function.
 */
const ref = (value: string) => {
  return { Ref: value }
}

/**
 * Wraps value in the Fn::ImportValue CloudFormation function.
 */
const importValue = (value: string) => ({
  'Fn::ImportValue': value,
})

export { findOneResourceId, ref, importValue }
