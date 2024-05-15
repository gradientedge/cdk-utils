import { Template } from 'aws-cdk-lib/assertions'

const findOneResourceId = (template: Template, name: string): string => {
  const resources = template.findResources(name)
  if (Object.keys(resources).length === 0) {
    throw new Error(`Resource ${name} not found`)
  } else if (Object.keys(resources).length > 1) {
    throw new Error(`Multiple resources with name ${name} found`)
  }
  return Object.keys(resources)[0]
}

const ref = (value: string) => {
  return { Ref: value }
}

export { findOneResourceId, ref }
