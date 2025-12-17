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
    const resourceNameElements = []
    if (!options?.exclude) {
      resourceNameElements.push(options?.globalPrefix ? this.props.globalPrefix : undefined)
      resourceNameElements.push(options?.prefix ?? this.props.resourcePrefix)
    }
    resourceNameElements.push(resourceName)
    if (!options?.exclude) {
      resourceNameElements.push(options?.suffix ?? this.props.resourceSuffix)
      resourceNameElements.push(options?.globalSuffix ? this.props.globalSuffix : undefined)
    }
    resourceNameElements.push(this.props.stage)
    return resourceNameElements.filter(resourceNameElement => resourceNameElement != undefined).join('-')
  }
}
