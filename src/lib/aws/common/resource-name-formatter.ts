import { Construct } from 'constructs'
import { CommonStackProps, ResourceNameFormatterProps } from './types'

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
    resourceNameElements.push(options?.prefix ?? this.props.resourcePrefix)
    resourceNameElements.push(resourceName)
    resourceNameElements.push(options?.suffix ?? this.props.resourceSuffix)
    resourceNameElements.push(this.props.stage)
    return resourceNameElements.filter(resourceNameElement => resourceNameElement != undefined).join('-')
  }
}
