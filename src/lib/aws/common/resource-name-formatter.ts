import { Construct } from 'constructs'
import { CommonStackProps, ResourceNameFormatterProps } from './types.js'

export class ResourceNameFormatter extends Construct {
  props: CommonStackProps

  constructor(parent: Construct, id: string, props: CommonStackProps) {
    super(parent, id)
    this.props = props
  }

  /**
   * @summary Helper method to format a resource name based on the provided options
   * @param resourceName the resource name to format
   * @param options options to control the formatting of the resource name
   * @returns The formatted resource name
   */
  public format(resourceName: string, options?: ResourceNameFormatterProps) {
    const elements = []

    if (!options?.exclude) {
      if (options?.globalPrefix) elements.push(this.props.globalPrefix)
      elements.push(options?.prefix ?? this.props.resourcePrefix)
    }

    elements.push(resourceName)

    if (!options?.exclude) {
      elements.push(options?.suffix ?? this.props.resourceSuffix)
      if (options?.globalSuffix) elements.push(this.props.globalSuffix)
    }

    elements.push(this.props.stage)

    return elements.filter(Boolean).join('-')
  }
}
